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
const GOOGLE_CALENDAR_EMBED_PATTERN =
  /https:\/\/calendar\.google\.com\/calendar\/embed\?[^"'\\\s<>]+/gi;
const TRACKED_LINK_HINT_PATTERN =
  /\b(event|calendar|ticket|register|registration|star[- ]?wars|unlimited|swu|showdown|qualifier|prerelease|premier|sealed|draft|tournament)\b/i;
const TRACKED_EVENT_HINT_PATTERN =
  /\b(ticket|event|showdown|qualifier|tournament|league|register|registration|weekly play|open play|constructed|sealed|draft|premier)\b/i;
const TRACKED_DISCOVERY_PATH_PATTERN =
  /\/(events?|collections?|products?|pages?|shop|search)\b/i;
const GOOGLE_CALENDAR_BASE64_PATTERN = /^[A-Za-z0-9+/=]+$/;
const NON_EVENT_PRODUCT_PATTERN =
  /\b(booster box|booster pack|carbonite|spotlight starter|starter deck|two-player starter|playmat|sleeves|deck pod|booster display|case)\b/i;
const MAX_DISCOVERED_TRACKED_LINKS = 12;

interface IcsPropertyValue {
  params: string[];
  value: string;
}

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
  const html = await fetchTrackedPageHtml(source.url);
  const events = await extractTrackedPageEventsFromHtml(html, source, source.url);

  if (!shouldDiscoverTrackedLinks(source.url)) {
    return filterTrackedPageEvents(events, source);
  }

  const discoveredLinks = extractTrackedPageLinks(load(html), source);
  if (!discoveredLinks.length) {
    return filterTrackedPageEvents(events, source);
  }

  const discoveredEvents = await Promise.all(
    discoveredLinks.map(async (url) => {
      try {
        const childHtml = await fetchTrackedPageHtml(url);
        return await extractTrackedPageEventsFromHtml(childHtml, source, url);
      } catch {
        return [];
      }
    }),
  );

  return filterTrackedPageEvents([...events, ...discoveredEvents.flat()], source);
}

function extractJsonLdEvents(
  $: ReturnType<typeof load>,
  source: ResolvedPageSource,
  pageUrl: string,
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
          url: asString(record.url) || pageUrl,
          location:
            getNestedString(record, ["location", "name"]) ||
            getNestedString(record, ["location", "address", "streetAddress"]) ||
            source.location,
          startDate: asString(record.startDate),
          endDate: asString(record.endDate),
        },
        source,
        pageUrl,
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
  pageUrl: string,
): NormalizedCalendarEvent[] {
  const titleCandidates = new Set<string>();
  const dateCandidates = new Set<string>();
  const keywords = source.keywords || DEFAULT_KEYWORDS;

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
  const titles = Array.from(titleCandidates).filter(
    (title) => keywords.length === 0 || keywords.some((keyword) => title.toLowerCase().includes(keyword)),
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
          url: pageUrl,
          location: source.location,
          startDate: candidate,
        },
        source,
        pageUrl,
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
  pageUrl: string,
): NormalizedCalendarEvent | null {
  const title = cleanText(raw.title);
  const keywords = source.keywords || DEFAULT_KEYWORDS;
  if (!title || (keywords.length > 0 && !keywords.some((keyword) => title.toLowerCase().includes(keyword)))) {
    return null;
  }

  const resolvedUrl = resolveTrackedUrl(pageUrl, raw.url || pageUrl);
  if (looksLikeMerchandiseListing(title, raw.description, resolvedUrl)) {
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
    sourceUid: buildSourceUid(
      "tracked-page",
      `${source.id}:${resolvedUrl}:${title}:${startDate.value.toISO()}`,
    ),
    sourceType: "tracked-page",
    sourceLabel: source.label,
    storeId: source.storeId,
    title,
    description: buildDescription([
      raw.description,
      `Imported from ${source.label}.`,
      resolvedUrl && resolvedUrl !== source.url ? `Original listing: ${resolvedUrl}` : undefined,
    ]),
    location: raw.location || source.location,
    url: resolvedUrl,
    start,
    end,
  };
}

async function fetchTrackedPageHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "user-agent": "NorCalSWU Calendar Sync/1.0 (+https://norcalswu.local)",
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`received ${response.status} from ${url}`);
  }

  return response.text();
}

async function extractTrackedPageEventsFromHtml(
  html: string,
  source: ResolvedPageSource,
  pageUrl: string,
): Promise<NormalizedCalendarEvent[]> {
  const $ = load(html);

  const embeddedGoogleCalendarEvents = await extractEmbeddedGoogleCalendarEvents(
    html,
    source,
    pageUrl,
  );

  return [
    ...extractJsonLdEvents($, source, pageUrl),
    ...extractSemanticDateEvents($, source, pageUrl),
    ...embeddedGoogleCalendarEvents,
  ];
}

function filterTrackedPageEvents(
  events: NormalizedCalendarEvent[],
  source: ResolvedPageSource,
): NormalizedCalendarEvent[] {
  const keywords = source.keywords || DEFAULT_KEYWORDS;
  const filteredEvents = dedupeEvents(events).filter((event) =>
    matchesTrackedKeywords(event, keywords),
  );
  const byIdentity = new Map<string, NormalizedCalendarEvent>();

  for (const event of filteredEvents) {
    const identity = buildTrackedEventIdentity(event);
    if (!byIdentity.has(identity)) {
      byIdentity.set(identity, event);
    }
  }

  return dedupeEvents(Array.from(byIdentity.values()));
}

function matchesTrackedKeywords(event: NormalizedCalendarEvent, keywords: string[]) {
  const haystack = `${event.title}\n${event.description || ""}\n${event.url || ""}`.toLowerCase();
  return keywords.length === 0 || keywords.some((keyword) => haystack.includes(keyword));
}

function buildTrackedEventIdentity(event: NormalizedCalendarEvent): string {
  return [
    event.storeId || "",
    cleanText(event.title).toLowerCase(),
    event.start.dateTime || event.start.date || "",
    event.end.dateTime || event.end.date || "",
    cleanText(event.location).toLowerCase(),
  ].join("::");
}

function shouldDiscoverTrackedLinks(pageUrl: string) {
  try {
    const { pathname, search } = new URL(pageUrl);
    return TRACKED_DISCOVERY_PATH_PATTERN.test(`${pathname}${search}`);
  } catch {
    return false;
  }
}

function extractTrackedPageLinks(
  $: ReturnType<typeof load>,
  source: ResolvedPageSource,
): string[] {
  const baseUrl = new URL(source.url);
  const candidates = new Map<string, number>();
  const keywords = source.keywords || DEFAULT_KEYWORDS;

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    const text = cleanText($(element).text());
    const resolvedUrl = resolveTrackedCandidateUrl(baseUrl, href);

    if (!resolvedUrl) {
      return;
    }

    const score = scoreTrackedPageLink(resolvedUrl, text, keywords);
    if (score <= 0) {
      return;
    }

    const previous = candidates.get(resolvedUrl) || 0;
    if (score > previous) {
      candidates.set(resolvedUrl, score);
    }
  });

  return Array.from(candidates.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, MAX_DISCOVERED_TRACKED_LINKS)
    .map(([url]) => url);
}

function resolveTrackedCandidateUrl(baseUrl: URL, href?: string | null): string | null {
  if (!href) {
    return null;
  }

  if (
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("javascript:")
  ) {
    return null;
  }

  try {
    const resolvedUrl = new URL(href, baseUrl);
    const assetPathPattern = /\.(?:avif|css|gif|ico|jpeg|jpg|js|json|pdf|png|svg|txt|webp|xml)$/i;

    if (resolvedUrl.origin !== baseUrl.origin) {
      return null;
    }

    if (assetPathPattern.test(resolvedUrl.pathname)) {
      return null;
    }

    if (
      resolvedUrl.pathname === baseUrl.pathname &&
      resolvedUrl.search === baseUrl.search
    ) {
      return null;
    }

    return resolvedUrl.toString();
  } catch {
    return null;
  }
}

function scoreTrackedPageLink(resolvedUrl: string, text: string, keywords: string[]) {
  let score = 0;
  const combined = `${resolvedUrl} ${text}`.toLowerCase();

  if (keywords.length > 0) {
    score += keywords.reduce((total, keyword) => total + (combined.includes(keyword) ? 3 : 0), 0);
  }

  if (TRACKED_LINK_HINT_PATTERN.test(combined)) {
    score += 4;
  }

  if (resolvedUrl.includes("/events")) {
    score += 4;
  }

  if (resolvedUrl.includes("/products/")) {
    score += 2;
  }

  if (resolvedUrl.includes("/collections/")) {
    score += 1;
  }

  if (!text) {
    score -= 1;
  }

  if (keywords.length === 0 && resolvedUrl.includes("/products/")) {
    score += 2;
  }

  return score >= (keywords.length === 0 ? 2 : 3) ? score : 0;
}

async function extractEmbeddedGoogleCalendarEvents(
  rawHtml: string,
  source: ResolvedPageSource,
  pageUrl: string,
): Promise<NormalizedCalendarEvent[]> {
  const calendarIds = extractGoogleCalendarIds(rawHtml);
  if (!calendarIds.length) {
    return [];
  }

  const results = await Promise.all(
    calendarIds.map(async (calendarId) => {
      try {
        const ics = await fetchGoogleCalendarIcs(calendarId);
        return parseGoogleCalendarEvents(ics, source, pageUrl, calendarId);
      } catch {
        return [];
      }
    }),
  );

  return results.flat();
}

function extractGoogleCalendarIds(rawHtml: string): string[] {
  const embedUrls = rawHtml.match(GOOGLE_CALENDAR_EMBED_PATTERN) || [];
  const ids = new Set<string>();

  for (const rawEmbedUrl of embedUrls) {
    const normalizedEmbedUrl = rawEmbedUrl.replace(/\\u0026/g, "&").replace(/&amp;/g, "&");

    try {
      const embedUrl = new URL(normalizedEmbedUrl);
      const rawCalendarId = cleanText(embedUrl.searchParams.get("src"));
      if (!rawCalendarId) {
        continue;
      }

      if (rawCalendarId.includes("@")) {
        ids.add(rawCalendarId);
        continue;
      }

      if (GOOGLE_CALENDAR_BASE64_PATTERN.test(rawCalendarId)) {
        const decodedCalendarId = Buffer.from(rawCalendarId, "base64").toString("utf8");
        if (decodedCalendarId.includes("@")) {
          ids.add(decodedCalendarId);
        }
      }
    } catch {
      continue;
    }
  }

  return Array.from(ids);
}

async function fetchGoogleCalendarIcs(calendarId: string): Promise<string> {
  const url = `https://calendar.google.com/calendar/ical/${encodeURIComponent(calendarId)}/public/basic.ics`;
  const response = await fetch(url, {
    headers: {
      "user-agent": "NorCalSWU Calendar Sync/1.0 (+https://norcalswu.local)",
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`received ${response.status} from ${url}`);
  }

  return response.text();
}

function parseGoogleCalendarEvents(
  ics: string,
  source: ResolvedPageSource,
  pageUrl: string,
  calendarId: string,
): NormalizedCalendarEvent[] {
  const lines = ics.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "").split("\n");
  const events: NormalizedCalendarEvent[] = [];
  let currentEvent: Record<string, IcsPropertyValue[]> | null = null;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      currentEvent = {};
      continue;
    }

    if (line === "END:VEVENT") {
      const normalizedEvent = normalizeGoogleCalendarEvent(currentEvent, source, pageUrl, calendarId);
      if (normalizedEvent) {
        events.push(normalizedEvent);
      }
      currentEvent = null;
      continue;
    }

    if (!currentEvent) {
      continue;
    }

    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) {
      continue;
    }

    const property = line.slice(0, separatorIndex);
    const value = line.slice(separatorIndex + 1);
    const [name, ...params] = property.split(";");
    const key = name.toUpperCase();

    currentEvent[key] = currentEvent[key] || [];
    currentEvent[key].push({
      params,
      value: unescapeIcsText(value),
    });
  }

  return events;
}

function normalizeGoogleCalendarEvent(
  event: Record<string, IcsPropertyValue[]> | null,
  source: ResolvedPageSource,
  pageUrl: string,
  calendarId: string,
): NormalizedCalendarEvent | null {
  if (!event || event.RRULE?.length) {
    return null;
  }

  const title = cleanText(event.SUMMARY?.[0]?.value);
  const startDate = parseIcsDateValue(event.DTSTART?.[0]);
  if (!title || !startDate) {
    return null;
  }

  if (looksLikeConfiguredWeeklyPlay(source.storeId, title, event.DESCRIPTION?.[0]?.value, startDate)) {
    return null;
  }

  const parsedEndDate = parseIcsDateValue(event.DTEND?.[0]);
  const resolvedEndDate =
    parsedEndDate && parsedEndDate.isAllDay
      ? parsedEndDate
      : parsedEndDate ||
        (startDate.isAllDay
          ? { value: startDate.value.plus({ days: 1 }), isAllDay: true }
          : {
              value: startDate.value.plus({ minutes: DEFAULT_EVENT_DURATION_MINUTES }),
              isAllDay: false,
            });

  const description = buildDescription([
    event.DESCRIPTION?.[0]?.value,
    `Imported from ${source.label}.`,
    event.URL?.[0]?.value && event.URL[0].value !== pageUrl
      ? `Original listing: ${event.URL[0].value}`
      : undefined,
  ]);

  return {
    sourceUid: buildSourceUid(
      "tracked-page",
      `${source.id}:${calendarId}:${event.UID?.[0]?.value || title}:${startDate.value.toISO()}`,
    ),
    sourceType: "tracked-page",
    sourceLabel: `${source.label} calendar`,
    storeId: source.storeId,
    title,
    description,
    location: cleanText(event.LOCATION?.[0]?.value) || source.location,
    url: resolveTrackedUrl(pageUrl, event.URL?.[0]?.value || pageUrl),
    start: buildCalendarDate(startDate),
    end: buildCalendarDate(resolvedEndDate),
  };
}

function parseIcsDateValue(property?: IcsPropertyValue): { value: DateTime; isAllDay: boolean } | null {
  if (!property) {
    return null;
  }

  const value = cleanText(property.value);
  if (!value) {
    return null;
  }

  const upperParams = property.params.map((param) => param.toUpperCase());
  const isAllDay = upperParams.includes("VALUE=DATE");

  if (isAllDay) {
    const date = DateTime.fromFormat(value, "yyyyLLdd", { zone: DEFAULT_TIMEZONE });
    return date.isValid ? { value: date, isAllDay: true } : null;
  }

  if (/^\d{8}T\d{6}Z$/.test(value)) {
    const date = DateTime.fromFormat(value, "yyyyLLdd'T'HHmmss'Z'", { zone: "utc" }).setZone(
      DEFAULT_TIMEZONE,
    );
    return date.isValid ? { value: date, isAllDay: false } : null;
  }

  const tzid = property.params.find((param) => param.startsWith("TZID="))?.slice(5) || DEFAULT_TIMEZONE;
  const format = value.length === 15 ? "yyyyLLdd'T'HHmmss" : "yyyyLLdd'T'HHmm";
  const date = DateTime.fromFormat(value, format, { zone: tzid });
  return date.isValid ? { value: date, isAllDay: false } : null;
}

function looksLikeConfiguredWeeklyPlay(
  storeId: string | undefined,
  title: string,
  description: string | undefined,
  parsedDate: { value: DateTime; isAllDay: boolean },
) {
  if (!storeId || parsedDate.isAllDay) {
    return false;
  }

  const weeklyPlay = stores[storeId]?.events.weeklyPlay;
  if (!weeklyPlay) {
    return false;
  }

  const haystack = `${title}\n${description || ""}`.toLowerCase();
  if (!["star wars", "unlimited", "swu"].some((keyword) => haystack.includes(keyword))) {
    return false;
  }

  return parseWeeklyPlaySlots(weeklyPlay).some((slot) => {
    if (slot.weekday !== parsedDate.value.weekday) {
      return false;
    }

    const { hour, minute } = parseTime(slot.timeLabel);
    const candidateMinutes = hour * 60 + minute;
    const eventMinutes = parsedDate.value.hour * 60 + parsedDate.value.minute;
    return Math.abs(candidateMinutes - eventMinutes) <= 60;
  });
}

function unescapeIcsText(value: string) {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function looksLikeMerchandiseListing(
  title: string,
  description: string | undefined,
  url: string,
) {
  const haystack = `${title}\n${description || ""}\n${url}`.toLowerCase();
  return NON_EVENT_PRODUCT_PATTERN.test(haystack) && !TRACKED_EVENT_HINT_PATTERN.test(haystack);
}

function resolveTrackedUrl(baseUrl: string, rawUrl?: string) {
  const candidate = cleanText(rawUrl);
  if (!candidate) {
    return baseUrl;
  }

  try {
    return new URL(candidate, baseUrl).toString();
  } catch {
    return baseUrl;
  }
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
