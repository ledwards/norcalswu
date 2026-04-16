import { createHash } from "crypto";
import { google, type calendar_v3 } from "googleapis";
import type { NormalizedCalendarEvent, SyncSummary } from "./types";

const MANAGED_BY_KEY = "managedBy";
const MANAGED_BY_VALUE = "norcalswu";
const SOURCE_UID_KEY = "sourceUid";
const FINGERPRINT_KEY = "fingerprint";
const SOURCE_TYPE_KEY = "sourceType";

export async function syncGoogleCalendar(
  events: NormalizedCalendarEvent[],
  dryRun = false,
  existingErrors: string[] = [],
): Promise<SyncSummary> {
  const summary: SyncSummary = {
    generatedEventCount: events.length,
    insertedCount: 0,
    updatedCount: 0,
    deletedCount: 0,
    skippedCount: 0,
    dryRun,
    errors: [...existingErrors],
  };

  if (dryRun) {
    return summary;
  }

  const calendarId = process.env.GOOGLE_CALENDAR_ID || process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID;
  if (!calendarId) {
    throw new Error("Missing GOOGLE_CALENDAR_ID");
  }

  const auth = new google.auth.GoogleAuth({
    credentials: getGoogleCredentials(),
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
  const calendar = google.calendar({ version: "v3", auth });

  const [timeMin, timeMax] = getSyncBounds(events);
  const existingEvents = await listManagedEvents(calendar, calendarId, timeMin, timeMax);
  const existingBySourceUid = new Map<string, calendar_v3.Schema$Event>();

  for (const existingEvent of existingEvents) {
    const sourceUid = existingEvent.extendedProperties?.private?.[SOURCE_UID_KEY];
    if (sourceUid) {
      existingBySourceUid.set(sourceUid, existingEvent);
    }
  }

  const desiredSourceUids = new Set<string>();

  for (const event of events) {
    desiredSourceUids.add(event.sourceUid);
    const fingerprint = buildEventFingerprint(event);
    const payload = buildGoogleEventPayload(event, fingerprint);
    const existingEvent = existingBySourceUid.get(event.sourceUid);

    if (!existingEvent) {
      await calendar.events.insert({
        calendarId,
        requestBody: payload,
      });
      summary.insertedCount += 1;
      continue;
    }

    const existingFingerprint = existingEvent.extendedProperties?.private?.[FINGERPRINT_KEY];
    if (existingFingerprint === fingerprint) {
      summary.skippedCount += 1;
      continue;
    }

    await calendar.events.update({
      calendarId,
      eventId: existingEvent.id || "",
      requestBody: payload,
    });
    summary.updatedCount += 1;
  }

  for (const existingEvent of existingEvents) {
    const sourceUid = existingEvent.extendedProperties?.private?.[SOURCE_UID_KEY];
    if (!sourceUid || desiredSourceUids.has(sourceUid) || !existingEvent.id) {
      continue;
    }

    await calendar.events.delete({
      calendarId,
      eventId: existingEvent.id,
    });
    summary.deletedCount += 1;
  }

  return summary;
}

function getGoogleCredentials() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  }

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error(
      "Missing Google service account credentials. Set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.",
    );
  }

  return {
    client_email: clientEmail,
    private_key: privateKey,
  };
}

async function listManagedEvents(
  calendar: calendar_v3.Calendar,
  calendarId: string,
  timeMin: string,
  timeMax: string,
) {
  const events: calendar_v3.Schema$Event[] = [];
  let pageToken: string | undefined;

  do {
    const response = await calendar.events.list({
      calendarId,
      maxResults: 2500,
      pageToken,
      privateExtendedProperty: [`${MANAGED_BY_KEY}=${MANAGED_BY_VALUE}`],
      showDeleted: false,
      timeMax,
      timeMin,
    });

    events.push(...(response.data.items || []));
    pageToken = response.data.nextPageToken || undefined;
  } while (pageToken);

  return events;
}

function getSyncBounds(events: NormalizedCalendarEvent[]) {
  const startValues = events
    .map((event) => event.start.dateTime || event.start.date)
    .filter(Boolean) as string[];
  const endValues = events
    .map((event) => event.end.dateTime || event.end.date)
    .filter(Boolean) as string[];

  const now = new Date();
  const min = startValues.length
    ? new Date([...startValues].sort()[0])
    : new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30);
  const max = endValues.length
    ? new Date([...endValues].sort()[endValues.length - 1])
    : new Date(now.getTime() + 1000 * 60 * 60 * 24 * 180);

  return [min.toISOString(), max.toISOString()] as const;
}

function buildGoogleEventPayload(event: NormalizedCalendarEvent, fingerprint: string) {
  return {
    summary: event.title,
    description: event.description,
    location: event.location,
    source: event.url
      ? {
          title: event.sourceLabel,
          url: event.url,
        }
      : undefined,
    status: "confirmed",
    start: event.start,
    end: event.end,
    extendedProperties: {
      private: {
        [MANAGED_BY_KEY]: MANAGED_BY_VALUE,
        [SOURCE_UID_KEY]: event.sourceUid,
        [FINGERPRINT_KEY]: fingerprint,
        [SOURCE_TYPE_KEY]: event.sourceType,
      },
    },
  } satisfies calendar_v3.Schema$Event;
}

function buildEventFingerprint(event: NormalizedCalendarEvent) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        description: event.description,
        end: event.end,
        location: event.location,
        sourceType: event.sourceType,
        start: event.start,
        title: event.title,
        url: event.url,
      }),
    )
    .digest("hex");
}
