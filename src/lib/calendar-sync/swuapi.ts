import { DateTime } from "luxon";
import { stores, type StoreRecord } from "../stores";
import type { NormalizedCalendarEvent } from "./types";

const DEFAULT_SWUAPI_BASE_URL = "https://api.swuapi.com";
const DEFAULT_SWUAPI_COUNTRY = "US";
const DEFAULT_SWUAPI_PAGE_LIMIT = 200;
const SWUAPI_STATUSES = ["upcoming", "live"] as const;
const OFFICIAL_FINDER_OWNED_TIERS = new Set(["SS", "PQ"]);
const MELEE_BASE_URL = "https://melee.gg/Tournament/View";
const TIER_LABELS: Record<string, string> = {
  SS: "Store Showdown",
  PQ: "Planetary Qualifier",
  SQ: "Sector Qualifier",
  RQ: "Regional Qualifier",
  GC: "Galactic Championship",
  LCQ: "Last Chance Qualifier",
  COM: "Community Event",
  CAS: "Casual Event",
};

interface SwuApiTournament {
  uuid?: string;
  name?: string;
  display_name?: string;
  date?: string;
  tier?: string;
  format?: string;
  player_count?: number;
  registered_player_count?: number | null;
  melee_id?: number | null;
  official?: boolean;
  status?: "upcoming" | "live" | "completed";
  venue_name?: string | null;
  venue_city?: string | null;
  venue_state?: string | null;
  venue_country?: string | null;
}

interface SwuApiTournamentPage {
  tournaments?: SwuApiTournament[];
  pagination?: {
    next_cursor?: string | null;
  };
}

interface MatchedStore {
  storeId: string;
  store: StoreRecord;
  score: number;
}

export async function collectSwuApiEvents(): Promise<NormalizedCalendarEvent[]> {
  const swuApiKey = process.env.SWUAPI_KEY;
  if (!swuApiKey) {
    return [];
  }

  const tournaments = await fetchSwuApiTournaments(swuApiKey);
  const events: NormalizedCalendarEvent[] = [];
  const seenTournamentIds = new Set<string>();

  for (const tournament of tournaments) {
    const stableId = getStableTournamentId(tournament);
    if (!stableId || seenTournamentIds.has(stableId) || OFFICIAL_FINDER_OWNED_TIERS.has(tournament.tier || "")) {
      continue;
    }

    const match = matchTournamentToStore(tournament);
    if (!match) {
      continue;
    }

    const event = normalizeTournamentEvent(match, tournament, stableId);
    if (!event) {
      continue;
    }

    seenTournamentIds.add(stableId);
    events.push(event);
  }

  return events;
}

async function fetchSwuApiTournaments(swuApiKey: string): Promise<SwuApiTournament[]> {
  const baseUrl = (process.env.SWUAPI_BASE_URL || DEFAULT_SWUAPI_BASE_URL).replace(/\/+$/, "");
  const country = process.env.SWUAPI_COUNTRY || DEFAULT_SWUAPI_COUNTRY;
  const pageLimit = parseIntegerEnv(process.env.SWUAPI_PAGE_LIMIT, DEFAULT_SWUAPI_PAGE_LIMIT);

  const results = await Promise.all(
    SWUAPI_STATUSES.map(async (status) => {
      const tournaments: SwuApiTournament[] = [];
      let cursor: string | null = "";

      while (cursor !== null) {
        const url = new URL(`${baseUrl}/tournaments`);
        url.searchParams.set("status", status);
        url.searchParams.set("official", "true");
        url.searchParams.set("country", country);
        url.searchParams.set("limit", String(pageLimit));
        if (cursor) {
          url.searchParams.set("after", cursor);
        }

        const response = await fetch(url, {
          headers: {
            authorization: `Bearer ${swuApiKey}`,
            "user-agent": "NorCalSWU Calendar Sync/1.0 (+https://norcalswu.local)",
          },
          next: { revalidate: 0 },
        });

        if (!response.ok) {
          throw new Error(`received ${response.status} from ${url.pathname}`);
        }

        const payload = (await response.json()) as SwuApiTournamentPage;
        const pageItems = Array.isArray(payload.tournaments) ? payload.tournaments : [];
        tournaments.push(...pageItems);

        const nextCursor = payload.pagination?.next_cursor;
        cursor = typeof nextCursor === "string" && nextCursor ? nextCursor : null;

        if (!pageItems.length) {
          break;
        }
      }

      return tournaments;
    }),
  );

  return results.flat();
}

function matchTournamentToStore(tournament: SwuApiTournament): MatchedStore | null {
  const matches = Object.entries(stores)
    .map(([storeId, store]) => ({
      storeId,
      store,
      score: scoreStoreMatch(store, tournament),
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

function scoreStoreMatch(store: StoreRecord, tournament: SwuApiTournament): number {
  const venueState = normalizeState(tournament.venue_state);
  const storeState = normalizeState(store.address.state);
  if (venueState && storeState && venueState !== storeState) {
    return 0;
  }

  const venueName = normalizeForMatch(tournament.venue_name);
  const eventName = normalizeForMatch(tournament.name || tournament.display_name);
  const storeCity = normalizeForMatch(store.address.city);
  const venueCity = normalizeForMatch(tournament.venue_city);
  const locationBonus = venueCity && storeCity && venueCity === storeCity ? 2 : 0;

  let bestNameScore = 0;
  for (const candidate of getStoreNameCandidates(store)) {
    if (!candidate) {
      continue;
    }

    if (venueName && venueName === candidate) {
      bestNameScore = Math.max(bestNameScore, 8);
      continue;
    }

    if (venueName && (venueName.includes(candidate) || candidate.includes(venueName))) {
      bestNameScore = Math.max(bestNameScore, 7);
      continue;
    }

    if (eventName && (eventName.includes(candidate) || candidate.includes(eventName))) {
      bestNameScore = Math.max(bestNameScore, 6);
    }
  }

  return bestNameScore > 0 ? bestNameScore + locationBonus : 0;
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

function normalizeTournamentEvent(
  match: MatchedStore,
  tournament: SwuApiTournament,
  stableId: string,
): NormalizedCalendarEvent | null {
  const date = extractTournamentDate(tournament.date);
  if (!date) {
    return null;
  }

  const title = cleanText(tournament.name || tournament.display_name);
  if (!title) {
    return null;
  }

  const meleeUrl =
    typeof tournament.melee_id === "number" ? `${MELEE_BASE_URL}/${tournament.melee_id}` : undefined;
  const tierLabel = tournament.tier ? TIER_LABELS[tournament.tier] || tournament.tier : undefined;
  const registeredCount =
    typeof tournament.registered_player_count === "number"
      ? tournament.registered_player_count
      : typeof tournament.player_count === "number" && tournament.player_count > 0
        ? tournament.player_count
        : undefined;
  const venueSummary = [tournament.venue_name, tournament.venue_city, tournament.venue_state]
    .map((value) => cleanText(value))
    .filter(Boolean)
    .join(", ");

  return {
    sourceUid: `swuapi-${stableId}`,
    sourceType: "swuapi",
    sourceLabel: "swuapi tournament feed",
    title,
    description: buildDescription([
      `Imported from swuapi.com tournament data sourced from melee.gg.`,
      `Matched to ${match.store.name}.`,
      tierLabel ? `Tier: ${tierLabel}` : undefined,
      tournament.format ? `Format: ${cleanText(tournament.format)}` : undefined,
      tournament.status ? `Status: ${cleanText(tournament.status)}` : undefined,
      registeredCount != null ? `Registered players: ${registeredCount}` : undefined,
      venueSummary ? `Venue: ${venueSummary}` : undefined,
      meleeUrl ? `Melee listing: ${meleeUrl}` : undefined,
    ]),
    location: venueSummary || formatStoreLocation(match.store),
    url: meleeUrl,
    start: {
      date,
    },
    end: {
      date: DateTime.fromISO(date, { zone: "utc" }).plus({ days: 1 }).toISODate() || undefined,
    },
  };
}

function getStableTournamentId(tournament: SwuApiTournament): string | null {
  if (tournament.uuid) {
    return tournament.uuid;
  }

  if (typeof tournament.melee_id === "number") {
    return `melee-${tournament.melee_id}`;
  }

  return null;
}

function extractTournamentDate(value?: string): string | null {
  const cleaned = cleanText(value);
  if (!cleaned) {
    return null;
  }

  const match = cleaned.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] || null;
}

function normalizeForMatch(value?: string | null): string {
  return cleanText(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeState(value?: string | null): string {
  return normalizeForMatch(value).replace(/\s+/g, "");
}

function formatStoreLocation(store: StoreRecord): string {
  return `${store.name}, ${store.address.street}, ${store.address.city}, ${store.address.state} ${store.address.zip}`;
}

function buildDescription(parts: Array<string | undefined>): string | undefined {
  const description = parts
    .map((part) => cleanText(part))
    .filter(Boolean)
    .join("\n\n");

  return description || undefined;
}

function cleanText(value?: string | null): string {
  return value?.replace(/\s+/g, " ").trim() || "";
}

function parseIntegerEnv(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}
