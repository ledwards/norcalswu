import { createHash } from "crypto";
import { load } from "cheerio";
import { DateTime, type WeekdayNumbers } from "luxon";
import {
  type StoreRecord,
  stores,
  trackedExternalSources,
  type TrackedPageSource,
} from "../stores";
import { collectOfficialFinderEvents } from "./official-swu";
import { collectSwuApiEvents } from "./swuapi";
import type { NormalizedCalendarEvent } from "./types";

const DEFAULT_TIMEZONE = process.env.CALENDAR_TIMEZONE || "America/Los_Angeles";
const DEFAULT_EVENT_DURATION_MINUTES = parseIntegerEnv(
  process.env.CALENDAR_DEFAULT_EVENT_DURATION_MINUTES,
  180,
);
const DEFAULT_SYNC_WINDOW_DAYS = parseIntegerEnv(
  process.env.CALENDAR_SYNC_WINDOW_DAYS,
  120,
);
const DEFAULT_KEYWORDS = ["star wars", "unlimited", "swu"];
const WEEKDAY_MAP: Record<string, WeekdayNumbers> = {
  sunday: 7,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const WEEKLY_PLAY_SEGMENT_PATTERN =
  /(Mondays?|Tuesdays?|Wednesdays?|Thursdays?|Fridays?|Saturdays?|Sundays?)\s+(\d{1,2}:\d{2}\s*[ap]m)(?:\s*\(([^)]+)\))?/gi;
const MONTH_NAME_PATTERN =
  /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i;

interface WeeklyPlaySlot {
  weekday: WeekdayNumbers;
  timeLabel: string;
  note?: string;
}

interface ResolvedPageSource extends TrackedPageSource {
  sourceType: "store" | "melee" | "swu";
  storeId?: string;
  storeName?: string;
  location?: string;
}

interface CollectNormalizedEventsOptions {
  weeklyPlayPastWindowDays?: number;
  weeklyPlayWindowDays?: number;
}

export async function collectNormalizedEvents(): Promise<{
  events: NormalizedCalendarEvent[];
  errors: string[];
}>;
export async function collectNormalizedEvents(
  options: CollectNormalizedEventsOptions,
): Promise<{
  events: NormalizedCalendarEvent[];
  errors: string[];
}>;
export async function collectNormalizedEvents(
  options: CollectNormalizedEventsOptions = {},
): Promise<{
  events: NormalizedCalendarEvent[];
  errors: string[];
}> {
  const events: NormalizedCalendarEvent[] = [];
  const errors: string[] = [];
  const weeklyPlayPastWindowDays = options.weeklyPlayPastWindowDays ?? 0;
  const weeklyPlayWindowDays = options.weeklyPlayWindowDays ?? DEFAULT_SYNC_WINDOW_DAYS;

  for (const [storeId, store] of Object.entries(stores)) {
    events.push(
      ...buildWeeklyPlayEvents(
        storeId,
        store,
        weeklyPlayWindowDays,
        weeklyPlayPastWindowDays,
      ),
    );
  }

  try {
    events.push(...(await collectOfficialFinderEvents()));
  } catch (error) {
    errors.push(formatError("starwarsunlimited.com", error));
  }

  try {
    events.push(...(await collectSwuApiEvents()));
  } catch (error) {
    errors.push(formatError("swuapi", error));
  }

  const pageResults = await Promise.all(
    getTrackedPageSources().map(async (source) => {
      try {
        return await buildTrackedPageEvents(source);
      } catch (error) {
        errors.push(formatError(source.label, error));
        return [];
      }
    }),
  );

  for (const pageEvents of pageResults) {
    events.push(...pageEvents);
  }

  return {
    events: dedupeEvents(events),
    errors,
  };
}

function buildWeeklyPlayEvents(
  storeId: string,
  store: StoreRecord,
  weeklyPlayWindowDays: number,
  weeklyPlayPastWindowDays: number,
): NormalizedCalendarEvent[] {
  const weeklyPlay = store.events.weeklyPlay;
  if (!weeklyPlay) {
    return [];
  }

  const slots = parseWeeklyPlaySlots(weeklyPlay);
  if (!slots.length) {
    return [];
  }

  const now = DateTime.now().setZone(DEFAULT_TIMEZONE);
  const windowStart = now.minus({ days: weeklyPlayPastWindowDays }).startOf("day");
  const horizon = now.plus({ days: weeklyPlayWindowDays });
  const location = formatStoreLocation(store);
  const sourceUrl = store.events.registrationUrl || store.social.website || store.social.store;
  const events: NormalizedCalendarEvent[] = [];

  for (const slot of slots) {
    let occurrence = nextOccurrence(slot, windowStart);
    while (occurrence <= horizon) {
      const end = occurrence.plus({ minutes: DEFAULT_EVENT_DURATION_MINUTES });
      const titleSuffix = slot.note ? ` (${slot.note})` : "";
      events.push({
        sourceUid: buildSourceUid(
          "weekly-play",
          `${storeId}:${slot.weekday}:${slot.timeLabel}:${occurrence.toISODate()}:${slot.note || "default"}`,
        ),
        sourceType: "weekly-play",
        sourceLabel: `${store.name} weekly play`,
        storeId,
        title: `${store.name} Star Wars: Unlimited Weekly Play${titleSuffix}`,
        description: buildDescription([slot.note ? `Format notes: ${slot.note}` : undefined]),
        location,
        url: sourceUrl,
        start: {
          dateTime: occurrence.toISO() || undefined,
          timeZone: DEFAULT_TIMEZONE,
        },
        end: {
          dateTime: end.toISO() || undefined,
          timeZone: DEFAULT_TIMEZONE,
        },
      });
      occurrence = occurrence.plus({ weeks: 1 });
    }
  }

  return events;
}

function parseWeeklyPlaySlots(weeklyPlay: string): WeeklyPlaySlot[] {
  const slots: WeeklyPlaySlot[] = [];

  for (const match of weeklyPlay.matchAll(WEEKLY_PLAY_SEGMENT_PATTERN)) {
    const weekdayLabel = match[1]?.toLowerCase().replace(/s$/, "");
    const weekday = weekdayLabel ? WEEKDAY_MAP[weekdayLabel] : undefined;
    const timeLabel = match[2]?.replace(/\s+/g, "");
    const note = match[3]?.trim();

    if (!weekday || !timeLabel) {
      continue;
    }

    slots.push({
      weekday,
      timeLabel,
      note,
    });
  }

  return slots;
}

function nextOccurrence(slot: WeeklyPlaySlot, now: DateTime): DateTime {
  const { hour, minute } = parseTime(slot.timeLabel);
  let candidate = now.set({
    weekday: slot.weekday,
    hour,
    minute,
    second: 0,
    millisecond: 0,
  });

  if (candidate < now) {
    candidate = candidate.plus({ weeks: 1 });
  }

  return candidate;
}

function parseTime(timeLabel: string): { hour: number; minute: number } {
  const match = timeLabel.trim().toLowerCase().match(/^(\d{1,2}):(\d{2})(am|pm)$/);
  if (!match) {
    return { hour: 19, minute: 0 };
  }

  const hourValue = Number.parseInt(match[1], 10);
  const minute = Number.parseInt(match[2], 10);
  const meridiem = match[3];

  if (meridiem === "am") {
    return { hour: hourValue === 12 ? 0 : hourValue, minute };
  }

  return { hour: hourValue === 12 ? 12 : hourValue + 12, minute };
}

function getTrackedPageSources(): ResolvedPageSource[] {
  const sources: ResolvedPageSource[] = [];

  for (const [storeId, store] of Object.entries(stores)) {
    const location = formatStoreLocation(store);

    if (store.events.registrationUrl) {
      sources.push({
        id: `${storeId}-registration`,
        label: `${store.name} registration page`,
        url: store.events.registrationUrl,
        sourceType: "store",
        storeId,
        storeName: store.name,
        location,
        keywords: DEFAULT_KEYWORDS,
      });
    }

    for (const trackedPage of store.sync?.trackedPages || []) {
      sources.push({
        ...trackedPage,
        sourceType: trackedPage.sourceType || "store",
        storeId,
        storeName: store.name,
        location,
        keywords: trackedPage.keywords || DEFAULT_KEYWORDS,
      });
    }
  }

  for (const source of trackedExternalSources) {
    sources.push({
      ...source,
      sourceType: source.sourceType || "store",
      keywords: source.keywords || DEFAULT_KEYWORDS,
    });
  }

  return sources;
}

async function buildTrackedPageEvents(
  source: ResolvedPageSource,
): Promise<NormalizedCalendarEvent[]> {
  const response = await fetch(source.url, {
    headers: {
      "user-agent": "NorCalSWU Calendar Sync/1.0 (+https://norcalswu.local)",
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`received ${response.status} from ${source.url}`);
  }

  const html = await response.text();
  const $ = load(html);

  const events = [
    ...extractJsonLdEvents($, source),
    ...extractSemanticDateEvents($, source),
  ];

  return dedupeEvents(events).filter((event) => {
    const haystack = `${event.title}\n${event.description || ""}`.toLowerCase();
    const keywords = source.keywords || DEFAULT_KEYWORDS;
    return keywords.length === 0 || keywords.some((keyword) => haystack.includes(keyword));
  });
}

function extractJsonLdEvents(
  $: ReturnType<typeof load>,
  source: ResolvedPageSource,
): NormalizedCalendarEvent[] {
  const events: NormalizedCalendarEvent[] = [];

  $('script[type="application/ld+json"]').each((_, element) => {
    const rawJson = $(element).contents().text().trim();
    if (!rawJson) {
      return;
    }

    for (const entity of collectJsonEntities(rawJson)) {
      if (!isEventEntity(entity)) {
        continue;
      }

      const record = entity as Record<string, unknown>;
      const normalized = normalizeStructuredEvent(
        {
          title: asString(record.name),
          description: asString(record.description),
          url: asString(record.url) || source.url,
          location:
            getNestedString(record, ["location", "name"]) ||
            getNestedString(record, ["location", "address", "streetAddress"]) ||
            source.location,
          startDate: asString(record.startDate),
          endDate: asString(record.endDate),
        },
        source,
      );

      if (normalized) {
        events.push(normalized);
      }
    }
  });

  return events;
}

function extractSemanticDateEvents(
  $: ReturnType<typeof load>,
  source: ResolvedPageSource,
): NormalizedCalendarEvent[] {
  const titleCandidates = new Set<string>();
  const dateCandidates = new Set<string>();

  $("h1, h2, h3, h4, [itemprop='name'], .product-title, .product-block__title").each(
    (_, element) => {
      const text = $(element).text().trim();
      if (text) {
        titleCandidates.add(cleanText(text));
      }
    },
  );

  $("time, [itemprop='startDate'], [datetime]").each((_, element) => {
    const datetime =
      $(element).attr("datetime") ||
      $(element).attr("content") ||
      $(element).text().trim();
    if (datetime) {
      dateCandidates.add(cleanText(datetime));
    }
  });

  if (dateCandidates.size === 0) {
    $("body")
      .text()
      .split("\n")
      .map((line) => cleanText(line))
      .filter((line) => line && MONTH_NAME_PATTERN.test(line))
      .slice(0, 20)
      .forEach((line) => dateCandidates.add(line));
  }

  const dateStrings = Array.from(dateCandidates);
  const titles = Array.from(titleCandidates).filter((title) =>
    (source.keywords || DEFAULT_KEYWORDS).some((keyword) => title.toLowerCase().includes(keyword)),
  );

  if (!titles.length || !dateStrings.length) {
    return [];
  }

  const events: NormalizedCalendarEvent[] = [];
  for (const title of titles.slice(0, 5)) {
    for (const candidate of dateStrings.slice(0, 10)) {
      const normalized = normalizeStructuredEvent(
        {
          title,
          description: `Discovered on ${source.label}.`,
          url: source.url,
          location: source.location,
          startDate: candidate,
        },
        source,
      );

      if (normalized) {
        events.push(normalized);
      }
    }
  }

  return events;
}

function normalizeStructuredEvent(
  raw: {
    title?: string;
    description?: string;
    url?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
  },
  source: ResolvedPageSource,
): NormalizedCalendarEvent | null {
  const title = cleanText(raw.title);
  if (!title || !(source.keywords || DEFAULT_KEYWORDS).some((keyword) => title.toLowerCase().includes(keyword))) {
    return null;
  }

  const startDate = parseEventDate(raw.startDate);
  if (!startDate) {
    return null;
  }

  const endDate = parseEventDate(raw.endDate);
  const resolvedEndDate =
    endDate && endDate.isAllDay
      ? { value: endDate.value.plus({ days: 1 }), isAllDay: true }
      : endDate ||
        (startDate.isAllDay
          ? { value: startDate.value.plus({ days: 1 }), isAllDay: true }
          : {
              value: startDate.value.plus({ minutes: DEFAULT_EVENT_DURATION_MINUTES }),
              isAllDay: false,
            });

  const start = buildCalendarDate(startDate);
  const end = buildCalendarDate(
    resolvedEndDate,
  );

  return {
    sourceUid: buildSourceUid("tracked-page", `${source.id}:${title}:${startDate.value.toISO()}`),
    sourceType: "tracked-page",
    sourceLabel: source.label,
    storeId: source.storeId,
    title,
    description: buildDescription([
      raw.description,
      `Imported from ${source.label}.`,
      raw.url && raw.url !== source.url ? `Original listing: ${raw.url}` : undefined,
    ]),
    location: raw.location || source.location,
    url: raw.url || source.url,
    start,
    end,
  };
}

function parseEventDate(rawValue?: string): { value: DateTime; isAllDay: boolean } | null {
  if (!rawValue) {
    return null;
  }

  const value = cleanText(rawValue);
  if (!value) {
    return null;
  }

  const isoDate = DateTime.fromISO(value, {
    zone: DEFAULT_TIMEZONE,
    setZone: true,
  });
  if (isoDate.isValid) {
    return {
      value: isoDate,
      isAllDay: !/[tT]\d{1,2}:\d{2}/.test(value),
    };
  }

  const naturalDate = DateTime.fromJSDate(new Date(value), {
    zone: DEFAULT_TIMEZONE,
  });
  if (naturalDate.isValid) {
    return {
      value: naturalDate,
      isAllDay: !/\d{1,2}:\d{2}/.test(value),
    };
  }

  return null;
}

function buildCalendarDate(parsedDate: { value: DateTime; isAllDay: boolean }) {
  if (parsedDate.isAllDay) {
    const date = parsedDate.value.toISODate();
    return { date: date || undefined };
  }

  return {
    dateTime: parsedDate.value.setZone(DEFAULT_TIMEZONE).toISO() || undefined,
    timeZone: DEFAULT_TIMEZONE,
  };
}

function collectJsonEntities(rawJson: string): unknown[] {
  try {
    const parsed = JSON.parse(rawJson);
    return flattenJsonEntities(parsed);
  } catch {
    return [];
  }
}

function flattenJsonEntities(entity: unknown): unknown[] {
  if (!entity) {
    return [];
  }

  if (Array.isArray(entity)) {
    return entity.flatMap(flattenJsonEntities);
  }

  if (typeof entity !== "object") {
    return [];
  }

  const record = entity as Record<string, unknown>;
  if (Array.isArray(record["@graph"])) {
    return record["@graph"].flatMap(flattenJsonEntities);
  }

  return [record];
}

function isEventEntity(entity: unknown): entity is Record<string, unknown> {
  if (!entity || typeof entity !== "object") {
    return false;
  }

  const typeValue = (entity as Record<string, unknown>)["@type"];
  if (typeof typeValue === "string") {
    return typeValue.toLowerCase().includes("event");
  }

  if (Array.isArray(typeValue)) {
    return typeValue.some(
      (value) => typeof value === "string" && value.toLowerCase().includes("event"),
    );
  }

  return false;
}

function dedupeEvents(events: NormalizedCalendarEvent[]): NormalizedCalendarEvent[] {
  const bySourceUid = new Map<string, NormalizedCalendarEvent>();

  for (const event of events) {
    if (!bySourceUid.has(event.sourceUid)) {
      bySourceUid.set(event.sourceUid, event);
    }
  }

  return Array.from(bySourceUid.values()).sort((left, right) => {
    const leftStart = left.start.dateTime || left.start.date || "";
    const rightStart = right.start.dateTime || right.start.date || "";
    return leftStart.localeCompare(rightStart);
  });
}

function buildSourceUid(prefix: string, value: string): string {
  return `${prefix}-${createHash("sha256").update(value).digest("hex").slice(0, 24)}`;
}

function buildDescription(parts: Array<string | undefined>): string | undefined {
  const description = parts
    .map((part) => cleanText(part))
    .filter(Boolean)
    .join("\n\n");

  return description || undefined;
}

function formatStoreLocation(store: StoreRecord): string {
  return `${store.name}, ${store.address.street}, ${store.address.city}, ${store.address.state} ${store.address.zip}`;
}

function cleanText(value?: string | null): string {
  return value?.replace(/\s+/g, " ").trim() || "";
}

function parseIntegerEnv(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function getNestedString(
  record: Record<string, unknown>,
  path: string[],
): string | undefined {
  let value: unknown = record;

  for (const segment of path) {
    if (!value || typeof value !== "object") {
      return undefined;
    }
    value = (value as Record<string, unknown>)[segment];
  }

  return asString(value);
}

function formatError(label: string, error: unknown): string {
  if (error instanceof Error) {
    return `${label}: ${error.message}`;
  }

  return `${label}: unknown error`;
}
