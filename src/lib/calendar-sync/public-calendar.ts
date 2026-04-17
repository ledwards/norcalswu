import { collectNormalizedEvents } from "./sources";
import type { CalendarEventDateTime, NormalizedCalendarEvent } from "./types";
import { storeRegions, stores } from "../stores";

const DEFAULT_PUBLIC_CALENDAR_WINDOW_DAYS = 365;
const DEFAULT_PUBLIC_CALENDAR_PAST_WINDOW_DAYS = 120;
const OTHER_REGION_ID = "other";
const OTHER_REGION_TITLE = "Other";

export interface PublicCalendarRegion {
  description?: string;
  id: string;
  title: string;
}

export interface PublicCalendarEvent {
  description?: string;
  end: CalendarEventDateTime;
  id: string;
  isAllDay: boolean;
  location?: string;
  regionId: string;
  regionTitle: string;
  sourceLabel: string;
  sourceType: NormalizedCalendarEvent["sourceType"];
  start: CalendarEventDateTime;
  store?: PublicCalendarStoreMeta;
  storeId?: string;
  storeName?: string;
  title: string;
  url?: string;
}

export interface PublicCalendarStoreLinks {
  discord?: string;
  onlineStore?: string;
  website?: string;
}

export interface PublicCalendarStoreMeta {
  addressLine: string;
  email?: string;
  googleMapsUrl: string;
  links: PublicCalendarStoreLinks;
  phone?: string;
}

export async function getPublicCalendarData(): Promise<{
  errors: string[];
  events: PublicCalendarEvent[];
  regions: PublicCalendarRegion[];
}> {
  const { events, errors } = await collectNormalizedEvents({
    weeklyPlayPastWindowDays: DEFAULT_PUBLIC_CALENDAR_PAST_WINDOW_DAYS,
    weeklyPlayWindowDays: DEFAULT_PUBLIC_CALENDAR_WINDOW_DAYS,
  });
  const regionLookup = buildStoreRegionLookup();
  const calendarEvents = events.map((event) => normalizePublicCalendarEvent(event, regionLookup));
  const regions = buildPublicCalendarRegions(calendarEvents, regionLookup);

  return {
    errors,
    events: calendarEvents,
    regions,
  };
}

function normalizePublicCalendarEvent(
  event: NormalizedCalendarEvent,
  regionLookup: Map<string, PublicCalendarRegion>,
): PublicCalendarEvent {
  const region = getEventRegion(event, regionLookup);

  return {
    description: event.description,
    end: event.end,
    id: event.sourceUid,
    isAllDay: Boolean(event.start.date),
    location: event.location,
    regionId: region.id,
    regionTitle: region.title,
    sourceLabel: event.sourceLabel,
    sourceType: event.sourceType,
    start: event.start,
    store: event.storeId ? buildStoreMeta(event.storeId) : undefined,
    storeId: event.storeId,
    storeName: event.storeId ? stores[event.storeId]?.name : undefined,
    title: event.title,
    url: event.url,
  };
}

function getEventRegion(
  event: NormalizedCalendarEvent,
  regionLookup: Map<string, PublicCalendarRegion>,
): PublicCalendarRegion {
  if (event.storeId) {
    const region = regionLookup.get(event.storeId);
    if (region) {
      return region;
    }
  }

  return {
    id: OTHER_REGION_ID,
    title: OTHER_REGION_TITLE,
  };
}

function buildStoreRegionLookup() {
  const lookup = new Map<string, PublicCalendarRegion>();

  for (const region of storeRegions) {
    for (const storeId of region.storeIds) {
      lookup.set(storeId, {
        description: region.description,
        id: region.id,
        title: region.title,
      });
    }
  }

  return lookup;
}

function buildPublicCalendarRegions(
  events: PublicCalendarEvent[],
  regionLookup: Map<string, PublicCalendarRegion>,
) {
  const regions = new Map<string, PublicCalendarRegion>();

  for (const region of regionLookup.values()) {
    regions.set(region.id, region);
  }

  if (events.some((event) => event.regionId === OTHER_REGION_ID)) {
    regions.set(OTHER_REGION_ID, {
      id: OTHER_REGION_ID,
      title: OTHER_REGION_TITLE,
    });
  }

  return Array.from(regions.values());
}

function buildStoreMeta(storeId: string): PublicCalendarStoreMeta | undefined {
  const store = stores[storeId];
  if (!store) {
    return undefined;
  }

  return {
    addressLine: `${store.address.street}, ${store.address.city}, ${store.address.state} ${store.address.zip}`,
    email: normalizeStoreValue(store.contact.email),
    googleMapsUrl: store.address.googleMapsUrl,
    links: {
      discord: normalizeStoreValue(store.social.discord),
      onlineStore: normalizeStoreValue(store.social.store),
      website: normalizeStoreValue(store.social.website),
    },
    phone: normalizeStoreValue(store.contact.phone),
  };
}

function normalizeStoreValue(value?: string) {
  const trimmed = value?.trim();
  return trimmed && trimmed.toLowerCase() !== "tbd" ? trimmed : undefined;
}
