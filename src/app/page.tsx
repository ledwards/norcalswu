import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { FaDiscord } from "react-icons/fa";
import CalendarWidget from "./components/CalendarWidget";
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
import { getPublicCalendarData } from "../lib/calendar-sync/public-calendar";
import { storeRegions, stores, type StoreRegion } from "../lib/stores";

const DISCORD_URL = "https://discord.gg/cdQHka47r7";
const COMMUNITY_URL = "https://discord.gg/cdQHka47r7";
const CALENDAR_CONTACT_TEXT =
  "Any events we are missing? Contact @terronk on the NorCal SWU Discord";
const STORE_FEEDBACK_TEXT =
  "Missing or incorrect information? Contact @terronk on the NorCal SWU Discord";
const WELCOME_TEXT =
  "Whether you're just starting out or a seasoned player, our community welcomes all skill levels. Join us for regular meetups, tournaments, and casual play sessions.";
const COMMUNITY_TEXT =
  "Connect with Star Wars: Unlimited players in the Northern California area. Share strategies, trade cards, and make new friends in the community.";
const DISCORD_BUTTON_CLASS_NAME =
  "inline-flex items-center justify-center gap-3 rounded-lg bg-[#5865F2] px-8 py-3 text-lg font-semibold text-white shadow-sm transition-colors hover:bg-[#4752C4]";

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

const MAJOR_EVENT_SECTION = {
  emptyText:
    "No upcoming U.S. Sector Qualifiers, U.S. Regional Championships, or Galactic Championship events are currently listed on the official competitive-play site.",
  title: "Upcoming Majors",
};

export const revalidate = 1800;

export default async function Home() {
  const { calendarData, localEventSections, majorEventsSection } = await getHomePageData();

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
        <DiscordButton href={DISCORD_URL}>Join our Discord</DiscordButton>
      </section>

      <ContentCard title="Upcoming Events" titleClassName="mb-6 text-2xl font-bold text-gray-900">
        <CalendarWidget
          errors={calendarData.errors}
          events={calendarData.events}
          regions={calendarData.regions}
        />
        <p className="text-center text-sm italic text-gray-600">{CALENDAR_CONTACT_TEXT}</p>
      </ContentCard>

      <section className="grid gap-8 md:grid-cols-2">
        {localEventSections.map((section) => (
          <EventHighlightsCard key={section.title} {...section} />
        ))}
      </section>

      <section>
        <EventHighlightsCard {...majorEventsSection} />
      </section>

      <section className="grid gap-8 md:grid-cols-2">
        <ContentCard title="New Players Welcome">
          <p className="text-gray-700">{WELCOME_TEXT}</p>
        </ContentCard>
        <ContentCard title="Find Local Players">
          <p className="mb-6 text-gray-700">{COMMUNITY_TEXT}</p>
          <DiscordButton href={COMMUNITY_URL}>Join the Community</DiscordButton>
        </ContentCard>
      </section>

      <ContentCard
        title="Local Game Stores"
        className="bg-[lightgoldenrodyellow]"
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

async function getHomePageData() {
  const [calendarData, competitiveEvents, majorEvents] = await Promise.all([
    getPublicCalendarData().catch(() => ({
      errors: ["Public calendar data could not be loaded."],
      events: [],
      regions: [],
    })),
    getUpcomingCompetitiveEvents().catch(() => []),
    getUpcomingOfficialMajorEvents().catch(() => []),
  ]);

  return {
    calendarData,
    localEventSections: LOCAL_EVENT_SECTION_CONFIGS.map((config) =>
      buildLocalEventSection(config, competitiveEvents),
    ),
    majorEventsSection: buildMajorEventsSection(majorEvents),
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

function buildMajorEventsSection(events: UpcomingOfficialMajorEvent[]) {
  return {
    emptyText: MAJOR_EVENT_SECTION.emptyText,
    events: events.map(mapMajorEvent),
    title: MAJOR_EVENT_SECTION.title,
  };
}

function DiscordButton({
  children,
  href,
}: {
  children: ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={DISCORD_BUTTON_CLASS_NAME}
      target="_blank"
      rel="noopener noreferrer"
    >
      <FaDiscord className="text-xl" aria-hidden="true" />
      <span>{children}</span>
    </Link>
  );
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
