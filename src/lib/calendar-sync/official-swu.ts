import { load } from "cheerio";
import { DateTime } from "luxon";
import { stores, type StoreRecord } from "../stores";
import type { NormalizedCalendarEvent } from "./types";

const DEFAULT_TIMEZONE = process.env.CALENDAR_TIMEZONE || "America/Los_Angeles";
const DEFAULT_EVENT_DURATION_MINUTES = parseIntegerEnv(
  process.env.CALENDAR_DEFAULT_EVENT_DURATION_MINUTES,
  180,
);
const DEFAULT_LOOKAHEAD_DAYS = parseIntegerEnv(
  process.env.CALENDAR_COMPETITIVE_LOOKAHEAD_DAYS,
  365,
);
const OFFICIAL_API_BASE_URL = "https://admin.starwarsunlimited.com/api";
const OFFICIAL_FINDER_BASE_URL = "https://starwarsunlimited.com/search?type=events";
const OFFICIAL_GC_HOME_URL = "https://galacticchampionship.starwarsunlimited.com/";
const OFFICIAL_GC_VENUE_URL = "https://galacticchampionship.starwarsunlimited.com/2026/venue-info";
const OFFICIAL_REGIONAL_PAGE_URL = "https://starwarsunlimited.com/regional-championships";
const OFFICIAL_SECTOR_PAGE_URL = "https://starwarsunlimited.com/sector-qualifiers";
const PAGE_SIZE = 100;
const US_COUNTRY_CODES = new Set(["unitedstates", "unitedstatesofamerica", "usa", "us"]);
const EVENT_TYPES = [
  { id: 3, label: "Store Showdown", slug: "store-showdown" },
  { id: 4, label: "Planetary Qualifier", slug: "planetary-qualifier" },
] as const;

type OfficialEventType = (typeof EVENT_TYPES)[number];
type OfficialEventTypeId = OfficialEventType["id"];
type CompetitiveEventSlug = OfficialEventType["slug"];
type OfficialMajorEventSlug =
  | "sector-qualifier"
  | "regional-championship"
  | "galactic-championship";

interface OfficialEventAddress {
  name?: string | null;
  street1?: string | null;
  street2?: string | null;
  city?: string | null;
  state?: string | null;
  zipcode?: string | null;
  formattedAddress?: string | null;
  country?: string | null;
}

interface OfficialEventRecord {
  id?: number;
  attributes?: {
    atLocation?: boolean | null;
    cost?: string | null;
    description?: string | null;
    endDate?: string | null;
    name?: string | null;
    startDate?: string | null;
    status?: string | null;
    url?: string | null;
    address?: OfficialEventAddress | null;
    location?: {
      data?: {
        attributes?: {
          name?: string | null;
          address?: OfficialEventAddress | null;
        } | null;
      } | null;
    } | null;
    type?: {
      data?: {
        id?: number;
        attributes?: {
          name?: string | null;
        } | null;
      } | null;
    } | null;
  } | null;
}

interface OfficialEventResponse {
  data?: OfficialEventRecord[];
  error?: {
    message?: string;
  };
  meta?: {
    pagination?: {
      page?: number;
      pageCount?: number;
    };
  };
}

interface MatchedStore {
  storeId: string;
  store: StoreRecord;
  score: number;
}

export interface UpcomingCompetitiveEvent {
  id: number;
  displayUrl: string;
  endDateTime?: string;
  externalUrl?: string;
  finderUrl: string;
  location: string;
  source: "official-swu";
  startDateTime: string;
  storeId: string;
  storeName: string;
  title: string;
  typeId: OfficialEventTypeId;
  typeLabel: string;
  typeSlug: CompetitiveEventSlug;
  venueName?: string;
}

export interface UpcomingOfficialMajorEvent {
  dateLabel: string;
  displayUrl: string;
  location: string;
  startDate: string;
  subtitle: string;
  title: string;
  typeLabel: string;
  typeSlug: OfficialMajorEventSlug;
}

export async function collectOfficialFinderEvents(): Promise<NormalizedCalendarEvent[]> {
  const events = await getUpcomingCompetitiveEvents();

  return events.map((event) => {
    const start = DateTime.fromISO(event.startDateTime, { setZone: true }).setZone(DEFAULT_TIMEZONE);
    const end = event.endDateTime
      ? DateTime.fromISO(event.endDateTime, { setZone: true }).setZone(DEFAULT_TIMEZONE)
      : start.plus({ minutes: DEFAULT_EVENT_DURATION_MINUTES });

    return {
      sourceUid: `official-swu-${event.id}`,
      sourceType: "official-swu",
      sourceLabel: "Star Wars: Unlimited event finder",
      storeId: event.storeId,
      title: event.title,
      description: buildDescription([
        "Imported from the official Star Wars: Unlimited event finder.",
        `Tracked store: ${event.storeName}.`,
        event.venueName && event.venueName !== event.storeName ? `Venue: ${event.venueName}.` : undefined,
        `Event type: ${event.typeLabel}.`,
        event.externalUrl && event.externalUrl !== event.finderUrl
          ? `Event page: ${event.externalUrl}`
          : `Official listing: ${event.finderUrl}`,
      ]),
      location: event.location,
      url: event.displayUrl,
      start: {
        dateTime: start.toISO() || undefined,
        timeZone: DEFAULT_TIMEZONE,
      },
      end: {
        dateTime: end.toISO() || undefined,
        timeZone: DEFAULT_TIMEZONE,
      },
    };
  });
}

export async function getUpcomingCompetitiveEvents(): Promise<UpcomingCompetitiveEvent[]> {
  const recordsByType = await Promise.all(EVENT_TYPES.map((eventType) => fetchOfficialEvents(eventType)));
  const events: UpcomingCompetitiveEvent[] = [];

  for (const records of recordsByType) {
    for (const record of records) {
      const event = normalizeOfficialEvent(record);
      if (event) {
        events.push(event);
      }
    }
  }

  return events.sort((left, right) => left.startDateTime.localeCompare(right.startDateTime));
}

export async function getUpcomingOfficialMajorEvents(): Promise<UpcomingOfficialMajorEvent[]> {
  const [sectors, regionals, gc] = await Promise.all([
    fetchOfficialMajorTableEvents({
      pageUrl: OFFICIAL_SECTOR_PAGE_URL,
      typeLabel: "Sector Qualifier",
      typeSlug: "sector-qualifier",
    }),
    fetchOfficialMajorTableEvents({
      pageUrl: OFFICIAL_REGIONAL_PAGE_URL,
      typeLabel: "Regional Championship",
      typeSlug: "regional-championship",
    }),
    fetchOfficialGalacticChampionshipEvent(),
  ]);

  return [...sectors, ...regionals, ...(gc ? [gc] : [])].sort((left, right) =>
    left.startDate.localeCompare(right.startDate),
  );
}

async function fetchOfficialEvents(eventType: OfficialEventType): Promise<OfficialEventRecord[]> {
  const records: OfficialEventRecord[] = [];
  let page = 1;
  let pageCount = 1;
  const now = DateTime.now().setZone(DEFAULT_TIMEZONE).startOf("day");
  const horizon = now.plus({ days: DEFAULT_LOOKAHEAD_DAYS }).endOf("day");

  do {
    const url = new URL(`${OFFICIAL_API_BASE_URL}/event-search`);
    url.searchParams.set("filters[type][id][$eq]", String(eventType.id));
    url.searchParams.set("filters[startDate][$gte]", String(now.toMillis()));
    url.searchParams.set("filters[startDate][$lte]", String(horizon.toMillis()));
    url.searchParams.set("filters[status][$eq]", "Approved");
    url.searchParams.set("sort[0]", "startDate:asc");
    url.searchParams.set("pagination[page]", String(page));
    url.searchParams.set("pagination[pageSize]", String(PAGE_SIZE));
    url.searchParams.set("populate", "*");

    const response = await fetch(url, {
      headers: {
        "user-agent": "NorCalSWU Calendar Sync/1.0 (+https://www.norcalswu.com)",
      },
      next: { revalidate: 1800 },
    });

    if (!response.ok) {
      throw new Error(`received ${response.status} from ${url.pathname}`);
    }

    const payload = (await response.json()) as OfficialEventResponse;
    if (payload.error?.message) {
      throw new Error(payload.error.message);
    }

    records.push(...(payload.data || []));
    pageCount = payload.meta?.pagination?.pageCount || page;
    page += 1;
  } while (page <= pageCount);

  return records;
}

async function fetchOfficialMajorTableEvents({
  pageUrl,
  typeLabel,
  typeSlug,
}: {
  pageUrl: string;
  typeLabel: string;
  typeSlug: Extract<OfficialMajorEventSlug, "sector-qualifier" | "regional-championship">;
}): Promise<UpcomingOfficialMajorEvent[]> {
  const html = await fetchOfficialHtml(pageUrl);
  const $ = load(html);
  const now = DateTime.now().setZone(DEFAULT_TIMEZONE).startOf("day");
  const events: UpcomingOfficialMajorEvent[] = [];

  for (const heading of $("h1").toArray().slice(1)) {
    const headingText = cleanText($(heading).text());
    const seasonLabel = getSeasonLabel(headingText, typeLabel);
    const table = $(heading).nextUntil("h1").filter("figure.table").first().find("table").first();

    if (!table.length) {
      continue;
    }

    for (const row of table.find("tr").slice(1).toArray()) {
      const cells = $(row).children("th, td").toArray();
      if (cells.length < 5) {
        continue;
      }

      const dateInfo = parseDateRangeLabel(cleanText($(cells[0]).text()), now);
      if (!dateInfo) {
        continue;
      }

      const venueText = cleanText($(cells[1]).text());
      const format = cleanText($(cells[2]).text());
      const city = cleanText($(cells[3]).text());
      const stateCountry = cleanText($(cells[4]).text());
      const href = cleanText($(cells[1]).find("a").attr("href"));

      if (!isUnitedStatesLocation(stateCountry)) {
        continue;
      }

      const locationLabel = city || stateCountry;

      events.push({
        dateLabel: dateInfo.label,
        displayUrl: toAbsoluteUrl(pageUrl, href) || pageUrl,
        location: [city, stateCountry].filter(Boolean).join(", ") || locationLabel,
        startDate: dateInfo.startDate,
        subtitle: [format, venueText].filter(Boolean).join(" | ") || typeLabel,
        title: buildOfficialMajorEventTitle(seasonLabel, typeLabel, locationLabel),
        typeLabel,
        typeSlug,
      });
    }
  }

  return events;
}

async function fetchOfficialGalacticChampionshipEvent(): Promise<UpcomingOfficialMajorEvent | null> {
  const [homeHtml, venueHtml] = await Promise.all([
    fetchOfficialHtml(OFFICIAL_GC_HOME_URL),
    fetchOfficialHtml(OFFICIAL_GC_VENUE_URL),
  ]);
  const homePage = load(homeHtml);
  const venuePage = load(venueHtml);
  const now = DateTime.now().setZone(DEFAULT_TIMEZONE).startOf("day");
  const locationLine =
    homePage("p")
      .toArray()
      .map((element) => cleanText(homePage(element).text()))
      .find((value) => /\|/.test(value) && /\b[A-Za-z]+\s+\d{1,2}-\d{1,2},\s+\d{4}\b/.test(value)) || "";
  const dateText = cleanText(locationLine.split("|")[0]);
  const cityLabel = cleanText(locationLine.split("|")[1]);
  const dateInfo = parseDateRangeLabel(dateText, now);

  if (!dateInfo) {
    return null;
  }

  const venueText =
    venuePage("p")
      .toArray()
      .map((element) => cleanText(venuePage(element).text()))
      .find((value) => /\bLas Vegas,\s*NV\b/.test(value) && /\d/.test(value)) || "";
  const venueName = cleanText(venueText.match(/^(.+?)\s+\d/)?.[1]);
  const location = venueName ? `${venueName}, ${cityLabel}` : cityLabel;

  return {
    dateLabel: dateInfo.label,
    displayUrl: OFFICIAL_GC_HOME_URL,
    location: location || "Las Vegas, USA",
    startDate: dateInfo.startDate,
    subtitle: venueName || "Official Galactic Championship site",
    title: "Galactic Championship 2026",
    typeLabel: "Galactic Championship",
    typeSlug: "galactic-championship",
  };
}

async function fetchOfficialHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "user-agent": "NorCalSWU Calendar Sync/1.0 (+https://www.norcalswu.com)",
    },
    next: { revalidate: 1800 },
  });

  if (!response.ok) {
    throw new Error(`received ${response.status} from ${url}`);
  }

  return response.text();
}

function normalizeOfficialEvent(record: OfficialEventRecord): UpcomingCompetitiveEvent | null {
  const eventId = record.id;
  const attributes = record.attributes;
  const eventTypeId = attributes?.type?.data?.id;
  const eventType = EVENT_TYPES.find((candidate) => candidate.id === eventTypeId);
  const startDateTime = cleanText(attributes?.startDate);

  if (!eventId || !eventType || !startDateTime) {
    return null;
  }

  const match = matchEventToStore(record);
  if (!match) {
    return null;
  }

  const finderUrl = `${OFFICIAL_FINDER_BASE_URL}&event=${eventId}`;
  const organizer = getOrganizer(record);
  const venue = getVenue(record);
  const externalUrl = cleanText(attributes?.url) || undefined;
  const title = buildEventTitle(match.store.name, cleanText(attributes?.name), eventType.label);
  const location = formatDisplayLocation(venue, organizer, match.store);

  return {
    id: eventId,
    displayUrl: externalUrl || finderUrl,
    endDateTime: cleanText(attributes?.endDate) || undefined,
    externalUrl,
    finderUrl,
    location,
    source: "official-swu",
    startDateTime,
    storeId: match.storeId,
    storeName: match.store.name,
    title,
    typeId: eventType.id,
    typeLabel: eventType.label,
    typeSlug: eventType.slug,
    venueName: cleanText(venue?.name) || undefined,
  };
}

function matchEventToStore(record: OfficialEventRecord): MatchedStore | null {
  const organizer = getOrganizer(record);
  const country = normalizeCountry(organizer?.country);
  if (country && !US_COUNTRY_CODES.has(country)) {
    return null;
  }

  const matches = Object.entries(stores)
    .map(([storeId, store]) => ({
      storeId,
      store,
      score: scoreStoreMatch(store, record),
    }))
    .filter((match) => match.score >= 6)
    .sort((left, right) => right.score - left.score);

  if (!matches.length) {
    return null;
  }

  if (matches.length > 1 && matches[0].score === matches[1].score) {
    return null;
  }

  return matches[0];
}

function scoreStoreMatch(store: StoreRecord, record: OfficialEventRecord): number {
  const organizer = getOrganizer(record);
  const venue = getVenue(record);
  const organizerState = normalizeState(organizer?.state);
  const storeState = normalizeState(store.address.state);
  if (organizerState && storeState && organizerState !== storeState) {
    return 0;
  }

  const organizerName = normalizeForMatch(organizer?.name);
  const eventName = normalizeForMatch(record.attributes?.name);
  const organizerCity = normalizeForMatch(organizer?.city || venue?.city);
  const storeCity = normalizeForMatch(store.address.city);
  const organizerStreet = normalizeForMatch(organizer?.street1);
  const storeStreet = normalizeForMatch(store.address.street);

  let score = 0;

  for (const candidate of getStoreNameCandidates(store)) {
    if (!candidate) {
      continue;
    }

    if (organizerName && organizerName === candidate) {
      score = Math.max(score, 9);
      continue;
    }

    if (organizerName && (organizerName.includes(candidate) || candidate.includes(organizerName))) {
      score = Math.max(score, 8);
      continue;
    }

    if (eventName && (eventName.includes(candidate) || candidate.includes(eventName))) {
      score = Math.max(score, 6);
    }
  }

  if (organizerStreet && storeStreet) {
    if (organizerStreet === storeStreet) {
      score = Math.max(score, 8);
    } else if (organizerStreet.includes(storeStreet) || storeStreet.includes(organizerStreet)) {
      score = Math.max(score, 7);
    }
  }

  if (organizerCity && storeCity && organizerCity === storeCity) {
    score += 2;
  }

  return score;
}

function getStoreNameCandidates(store: StoreRecord): string[] {
  const candidates = new Set<string>();
  const addCandidate = (value?: string) => {
    const normalized = normalizeForMatch(value);
    if (normalized.length >= 4) {
      candidates.add(normalized);
    }
  };

  addCandidate(store.name);
  addCandidate(store.name.replace(/^The\s+/i, ""));
  addCandidate(store.name.replace(/\bSF\b/i, ""));

  for (const alias of store.sync?.swuapiAliases || []) {
    addCandidate(alias);
  }

  return Array.from(candidates);
}

function getOrganizer(record: OfficialEventRecord): OfficialEventAddress | null {
  const location = record.attributes?.location?.data?.attributes;
  const address = location?.address;

  if (!location?.name && !address) {
    return null;
  }

  return {
    ...address,
    name: cleanText(location?.name) || cleanText(address?.name) || undefined,
  };
}

function getVenue(record: OfficialEventRecord): OfficialEventAddress | null {
  const address = record.attributes?.address;
  if (!address) {
    return null;
  }

  return {
    ...address,
    name: cleanText(address.name) || undefined,
  };
}

function formatDisplayLocation(
  venue: OfficialEventAddress | null,
  organizer: OfficialEventAddress | null,
  store: StoreRecord,
): string {
  return formatAddressBlock(venue) || formatAddressBlock(organizer) || formatStoreLocation(store);
}

function formatAddressBlock(address: OfficialEventAddress | null): string {
  if (!address) {
    return "";
  }

  const headline = cleanText(address.name);
  const street = [address.street1, address.street2].map(cleanText).filter(Boolean).join(" ");
  const cityLine = [address.city, address.state, address.zipcode]
    .map(cleanText)
    .filter(Boolean)
    .join(" ");

  return [headline, street, cityLine].filter(Boolean).join(", ");
}

function formatStoreLocation(store: StoreRecord): string {
  return `${store.name}, ${store.address.street}, ${store.address.city}, ${store.address.state} ${store.address.zip}`;
}

function buildEventTitle(storeName: string, eventName: string, eventTypeLabel: string) {
  if (!eventName) {
    return `${storeName} ${eventTypeLabel}`;
  }

  return normalizeForMatch(eventName) === normalizeForMatch(eventTypeLabel)
    ? `${storeName} ${eventTypeLabel}`
    : eventName;
}

function buildOfficialMajorEventTitle(seasonLabel: string, typeLabel: string, locationLabel: string) {
  const base = [seasonLabel, typeLabel].filter(Boolean).join(" ");
  return locationLabel ? `${base} - ${locationLabel}` : base;
}

function buildDescription(parts: Array<string | undefined>): string | undefined {
  const description = parts
    .map((part) => cleanText(part))
    .filter(Boolean)
    .join("\n\n");

  return description || undefined;
}

function getSeasonLabel(headingText: string, typeLabel: string): string {
  const normalized = cleanText(headingText);
  const singularPattern = new RegExp(`\\b${typeLabel}\\b`, "i");
  const pluralPattern = new RegExp(`\\b${typeLabel}s\\b`, "i");

  return normalized.replace(pluralPattern, "").replace(singularPattern, "").trim();
}

function normalizeForMatch(value?: string | null): string {
  return cleanText(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeState(value?: string | null): string {
  const normalized = normalizeForMatch(value).replace(/\s+/g, "");
  if (normalized === "california") {
    return "ca";
  }

  return normalized;
}

function normalizeCountry(value?: string | null): string {
  return normalizeForMatch(value).replace(/\s+/g, "");
}

function isUnitedStatesLocation(value: string) {
  return /\b(USA|US|United States|United States of America)\b/i.test(value);
}

function cleanText(value?: string | null): string {
  return value?.replace(/\s+/g, " ").trim() || "";
}

function parseDateRangeLabel(
  value: string,
  now: DateTime,
): {
  label: string;
  startDate: string;
} | null {
  const crossMonthMatch =
    value.match(/^([A-Za-z]+)\s+(\d{1,2})-([A-Za-z]+)\s+(\d{1,2})(?:,\s*(\d{4}))?$/) || null;
  if (crossMonthMatch) {
    const [, startMonth, startDay, endMonth, endDay, explicitYear] = crossMonthMatch;
    const year = getCompetitiveEventYear(startMonth, Number.parseInt(startDay, 10), explicitYear, now);
    const start = DateTime.fromFormat(`${startMonth} ${startDay} ${year}`, "LLLL d yyyy", {
      zone: DEFAULT_TIMEZONE,
    });
    const end = DateTime.fromFormat(`${endMonth} ${endDay} ${year}`, "LLLL d yyyy", {
      zone: DEFAULT_TIMEZONE,
    });

    if (start.isValid && end.isValid && start >= now) {
      return {
        label: formatDateRange(start, end),
        startDate: start.toISODate() || "",
      };
    }
  }

  const sameMonthMatch =
    value.match(/^([A-Za-z]+)\s+(\d{1,2})(?:-(\d{1,2}))?(?:,\s*(\d{4}))?$/) || null;
  if (!sameMonthMatch) {
    return null;
  }

  const [, month, startDay, maybeEndDay, explicitYear] = sameMonthMatch;
  const year = getCompetitiveEventYear(month, Number.parseInt(startDay, 10), explicitYear, now);
  const endDay = maybeEndDay || startDay;
  const start = DateTime.fromFormat(`${month} ${startDay} ${year}`, "LLLL d yyyy", {
    zone: DEFAULT_TIMEZONE,
  });
  const end = DateTime.fromFormat(`${month} ${endDay} ${year}`, "LLLL d yyyy", {
    zone: DEFAULT_TIMEZONE,
  });

  if (!start.isValid || !end.isValid || start < now) {
    return null;
  }

  return {
    label: formatDateRange(start, end),
    startDate: start.toISODate() || "",
  };
}

function getCompetitiveEventYear(
  month: string,
  day: number,
  explicitYear: string | undefined,
  now: DateTime,
) {
  if (explicitYear) {
    return Number.parseInt(explicitYear, 10);
  }

  const thisYear = DateTime.fromFormat(`${month} ${day} ${now.year}`, "LLLL d yyyy", {
    zone: DEFAULT_TIMEZONE,
  });

  return thisYear.isValid && thisYear >= now ? now.year : now.year + 1;
}

function formatDateRange(start: DateTime, end: DateTime): string {
  if (start.hasSame(end, "day")) {
    return start.toFormat("MMM d, yyyy");
  }

  if (start.year === end.year && start.month === end.month) {
    return `${start.toFormat("MMM d")}-${end.toFormat("d, yyyy")}`;
  }

  if (start.year === end.year) {
    return `${start.toFormat("MMM d")}-${end.toFormat("MMM d, yyyy")}`;
  }

  return `${start.toFormat("MMM d, yyyy")}-${end.toFormat("MMM d, yyyy")}`;
}

function toAbsoluteUrl(baseUrl: string, href?: string | null): string {
  const value = cleanText(href);
  if (!value) {
    return "";
  }

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return value;
  }
}

function parseIntegerEnv(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}
