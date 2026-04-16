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
const PAGE_SIZE = 100;
const US_COUNTRY_CODES = new Set(["unitedstates", "unitedstatesofamerica", "usa", "us"]);
const EVENT_TYPES = [
  { id: 3, label: "Store Showdown", slug: "store-showdown" },
  { id: 4, label: "Planetary Qualifier", slug: "planetary-qualifier" },
] as const;

type OfficialEventType = (typeof EVENT_TYPES)[number];
type OfficialEventTypeId = OfficialEventType["id"];
type CompetitiveEventSlug = OfficialEventType["slug"];

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

function buildDescription(parts: Array<string | undefined>): string | undefined {
  const description = parts
    .map((part) => cleanText(part))
    .filter(Boolean)
    .join("\n\n");

  return description || undefined;
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

function cleanText(value?: string | null): string {
  return value?.replace(/\s+/g, " ").trim() || "";
}

function parseIntegerEnv(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}
