import Image from "next/image";
import Link from "next/link";
import ContentCard from "./components/ContentCard";
import EventHighlightsCard, {
  type HighlightedEvent,
} from "./components/EventHighlightsCard";
import StoreCard from "./components/StoreCard";
import {
  getUpcomingCompetitiveEvents,
  getUpcomingOfficialMajorEvents,
  type UpcomingCompetitiveEvent,
  type UpcomingOfficialMajorEvent,
} from "../lib/calendar-sync/official-swu";
import { storeRegions, stores, type StoreRegion } from "../lib/stores";

const CALENDAR_EMBED_URL =
  "https://calendar.google.com/calendar/embed?src=047048eefea36248a07bfb5565ea9a9d6741d8a8ca0cf11f49a7e90dedd88a8e%40group.calendar.google.com&mode=AGENDA";
const DISCORD_URL = "https://discord.gg/B4BxV3sAbD";
const COMMUNITY_URL = "https://discord.gg/YJRtwBCMSa";
const CALENDAR_CONTACT_TEXT =
  "Interested in being an admin for this calendar? Contact @terronk on the NorCal SWU Discord";
const STORE_FEEDBACK_TEXT =
  "Missing or incorrect information? Contact @terronk on the NorCal SWU Discord";
const WELCOME_TEXT =
  "Whether you're just starting out or a seasoned player, our community welcomes all skill levels. Join us for regular meetups, tournaments, and casual play sessions.";
const COMMUNITY_TEXT =
  "Connect with Star Wars: Unlimited players in the Northern California area. Share strategies, trade cards, and make new friends in the community.";

const LOCAL_EVENT_SECTION_CONFIGS: Array<{
  emptyText: string;
  limit: number;
  slug: UpcomingCompetitiveEvent["typeSlug"];
  title: string;
}> = [
  {
    emptyText: "No NorCal PQ is currently published in the official event finder.",
    limit: 6,
    slug: "planetary-qualifier",
    title: "Upcoming Planetary Qualifiers",
  },
  {
    emptyText: "No NorCal Store Showdown is currently published in the official event finder.",
    limit: 6,
    slug: "store-showdown",
    title: "Upcoming Store Showdowns",
  },
];

const MAJOR_EVENT_SECTION_CONFIGS: Array<{
  emptyText: string;
  slug: UpcomingOfficialMajorEvent["typeSlug"];
  title: string;
}> = [
  {
    emptyText:
      "No upcoming U.S. Sector Qualifiers are currently listed on the official competitive-play site.",
    slug: "sector-qualifier",
    title: "Upcoming Sector Qualifiers (U.S.)",
  },
  {
    emptyText:
      "No upcoming U.S. Regional Championships are currently listed on the official competitive-play site.",
    slug: "regional-championship",
    title: "Upcoming Regional Championships (U.S.)",
  },
  {
    emptyText:
      "No upcoming Galactic Championship is currently listed on the official competitive-play site.",
    slug: "galactic-championship",
    title: "Upcoming Galactic Championship",
  },
];

export const revalidate = 1800;

export default async function Home() {
  const { localEventSections, majorEventSections } = await getHomePageSections();

  return (
    <div className="space-y-12">
      <section className="bg-white py-8 text-center">
        <div className="mx-auto mb-6 w-full md:w-[50%]">
          <Image
            src="/NorCalSWU.png"
            alt="NorCal Star Wars: Unlimited Logo"
            width={600}
            height={338}
            className="h-auto w-full"
            priority
          />
        </div>
        <h1 className="sr-only">NorCal Star Wars: Unlimited</h1>
        <p className="mx-auto mb-6 max-w-lg text-xl leading-relaxed text-gray-900">
          <span className="md:hidden">
            Join our growing community of Star Wars: Unlimited players in Northern California
          </span>
          <span className="hidden md:inline">
            Join our growing community of
            <br />
            Star Wars: Unlimited players
            <br />
            in Northern California
          </span>
        </p>
        <Link
          href={DISCORD_URL}
          className="inline-block rounded-lg bg-[#463E3F] px-8 py-3 text-lg font-semibold text-white shadow-sm transition-colors hover:bg-[#5865F2]"
          target="_blank"
          rel="noopener noreferrer"
        >
          Join our Discord
        </Link>
      </section>

      <ContentCard title="Upcoming Events" titleClassName="mb-6 text-2xl font-bold text-gray-900">
        <div className="mb-4 aspect-[3/2] w-full">
          <iframe
            src={CALENDAR_EMBED_URL}
            title="NorCal Star Wars Unlimited community calendar"
            style={{ border: 0 }}
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            loading="lazy"
          ></iframe>
        </div>
        <p className="text-center text-sm italic text-gray-600">{CALENDAR_CONTACT_TEXT}</p>
      </ContentCard>

      <section className="grid gap-8 md:grid-cols-2">
        {localEventSections.map((section) => (
          <EventHighlightsCard key={section.title} {...section} />
        ))}
      </section>

      <section className="grid gap-8 md:grid-cols-3">
        {majorEventSections.map((section) => (
          <EventHighlightsCard key={section.title} {...section} />
        ))}
      </section>

      <section className="grid gap-8 md:grid-cols-2">
        <ContentCard title="New Players Welcome">
          <p className="text-gray-700">{WELCOME_TEXT}</p>
        </ContentCard>
        <ContentCard title="Find Local Players">
          <p className="mb-6 text-gray-700">{COMMUNITY_TEXT}</p>
          <Link
            href={COMMUNITY_URL}
            className="inline-block rounded-lg bg-[#463E3F] px-8 py-3 text-lg font-semibold text-white shadow-sm transition-colors hover:bg-[#5865F2]"
            target="_blank"
            rel="noopener noreferrer"
          >
            Join the Community →
          </Link>
        </ContentCard>
      </section>

      <ContentCard
        title="Local Game Stores"
        titleClassName="mb-8 text-2xl font-bold text-gray-900"
      >
        {storeRegions.map((region) => (
          <StoreRegionGroup key={region.id} region={region} />
        ))}

        <p className="text-center text-sm italic text-gray-600">{STORE_FEEDBACK_TEXT}</p>
      </ContentCard>
    </div>
  );
}

async function getHomePageSections() {
  const [competitiveEvents, majorEvents] = await Promise.all([
    getUpcomingCompetitiveEvents().catch(() => []),
    getUpcomingOfficialMajorEvents().catch(() => []),
  ]);

  return {
    localEventSections: LOCAL_EVENT_SECTION_CONFIGS.map((config) =>
      buildLocalEventSection(config, competitiveEvents),
    ),
    majorEventSections: MAJOR_EVENT_SECTION_CONFIGS.map((config) =>
      buildMajorEventSection(config, majorEvents),
    ),
  };
}

function buildLocalEventSection(
  config: (typeof LOCAL_EVENT_SECTION_CONFIGS)[number],
  events: UpcomingCompetitiveEvent[],
) {
  return {
    emptyText: config.emptyText,
    events: events
      .filter((event) => event.typeSlug === config.slug)
      .slice(0, config.limit)
      .map(mapLocalCompetitiveEvent),
    title: config.title,
  };
}

function buildMajorEventSection(
  config: (typeof MAJOR_EVENT_SECTION_CONFIGS)[number],
  events: UpcomingOfficialMajorEvent[],
) {
  return {
    emptyText: config.emptyText,
    events: events.filter((event) => event.typeSlug === config.slug).map(mapMajorEvent),
    title: config.title,
  };
}

function StoreRegionGroup({ region }: { region: StoreRegion }) {
  return (
    <div className="mb-12 last:mb-0">
      <h3 className="mb-6 border-b pb-2 text-xl font-bold text-gray-900">{region.title}</h3>
      {region.description ? <p className="mb-2 text-sm text-gray-800">{region.description}</p> : null}
      <div className="grid auto-cols-min gap-8 md:grid-cols-2">
        {region.storeIds.map((storeId) => (
          <StoreCard key={storeId} {...stores[storeId]} />
        ))}
      </div>
    </div>
  );
}

function mapLocalCompetitiveEvent(event: UpcomingCompetitiveEvent): HighlightedEvent {
  return {
    dateValue: event.startDateTime,
    key: `${event.typeSlug}-${event.id}`,
    location: event.location,
    primaryUrl: event.displayUrl,
    secondaryUrl: event.externalUrl && event.externalUrl !== event.finderUrl ? event.finderUrl : undefined,
    subtitle: event.storeName,
    title: event.title,
  };
}

function mapMajorEvent(event: UpcomingOfficialMajorEvent): HighlightedEvent {
  return {
    dateLabel: event.dateLabel,
    dateValue: event.startDate,
    key: `${event.typeSlug}-${event.startDate}-${event.title}`,
    location: event.location,
    primaryUrl: event.displayUrl,
    subtitle: event.subtitle,
    title: event.title,
  };
}
