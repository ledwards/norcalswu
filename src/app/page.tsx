import Image from "next/image";
import Link from "next/link";
import StoreCard from "./components/StoreCard";
import {
  getUpcomingCompetitiveEvents,
  type UpcomingCompetitiveEvent,
} from "../lib/calendar-sync/official-swu";
import { storeRegions, stores } from "../lib/stores";

export const revalidate = 1800;

export default async function Home() {
  const competitiveEvents = await getUpcomingCompetitiveEvents().catch(() => []);
  const upcomingPqs = competitiveEvents
    .filter((event) => event.typeSlug === "planetary-qualifier")
    .slice(0, 6);
  const upcomingShowdowns = competitiveEvents
    .filter((event) => event.typeSlug === "store-showdown")
    .slice(0, 6);

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
          href="https://discord.gg/B4BxV3sAbD"
          className="inline-block rounded-lg bg-[#463E3F] px-8 py-3 text-lg font-semibold text-white shadow-sm transition-colors hover:bg-[#5865F2]"
          target="_blank"
          rel="noopener noreferrer"
        >
          Join our Discord
        </Link>
      </section>

      <section className="rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Upcoming Events</h2>
        <div className="mb-4 aspect-[3/2] w-full">
          <iframe
            src="https://calendar.google.com/calendar/embed?src=047048eefea36248a07bfb5565ea9a9d6741d8a8ca0cf11f49a7e90dedd88a8e%40group.calendar.google.com&mode=AGENDA"
            title="NorCal Star Wars Unlimited community calendar"
            style={{ border: 0 }}
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            loading="lazy"
          ></iframe>
        </div>
        <p className="text-center text-sm italic text-gray-600">
          Interested in being an admin for this calendar? Contact @terronk on the NorCal SWU
          Discord
        </p>
      </section>

      <section className="grid gap-8 md:grid-cols-2">
        <EventHighlightsCard
          title="Upcoming Planetary Qualifiers"
          emptyText="No NorCal PQ is currently published in the official event finder."
          events={upcomingPqs}
        />
        <EventHighlightsCard
          title="Upcoming Store Showdowns"
          emptyText="No NorCal Store Showdown is currently published in the official event finder."
          events={upcomingShowdowns}
        />
      </section>

      <section className="grid gap-8 md:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">New Players Welcome</h2>
          <p className="text-gray-700">
            Whether you&apos;re just starting out or a seasoned player, our community welcomes all
            skill levels. Join us for regular meetups, tournaments, and casual play sessions.
          </p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">Find Local Players</h2>
          <p className="mb-6 text-gray-700">
            Connect with Star Wars: Unlimited players in the Northern California area. Share
            strategies, trade cards, and make new friends in the community.
          </p>
          <Link
            href="https://discord.gg/YJRtwBCMSa"
            className="inline-block rounded-lg bg-[#463E3F] px-8 py-3 text-lg font-semibold text-white shadow-sm transition-colors hover:bg-[#5865F2]"
            target="_blank"
            rel="noopener noreferrer"
          >
            Join the Community →
          </Link>
        </div>
      </section>

      <section className="rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-8 text-2xl font-bold text-gray-900">Local Game Stores</h2>

        {storeRegions.map((region) => (
          <div key={region.id} className="mb-12 last:mb-0">
            <h3 className="mb-6 border-b pb-2 text-xl font-bold text-gray-900">{region.title}</h3>
            {region.description ? (
              <p className="mb-2 text-sm text-gray-800">{region.description}</p>
            ) : null}
            <div className="grid auto-cols-min gap-8 md:grid-cols-2">
              {region.storeIds.map((storeId) => (
                <StoreCard key={storeId} {...stores[storeId]} />
              ))}
            </div>
          </div>
        ))}

        <p className="text-center text-sm italic text-gray-600">
          Missing or incorrect information? Contact @terronk on the NorCal SWU Discord
        </p>
      </section>
    </div>
  );
}

function EventHighlightsCard({
  emptyText,
  events,
  title,
}: {
  emptyText: string;
  events: UpcomingCompetitiveEvent[];
  title: string;
}) {
  return (
    <div className="rounded-lg bg-white p-6 shadow-lg">
      <h2 className="mb-4 text-2xl font-bold text-gray-900">{title}</h2>
      {events.length ? (
        <div className="space-y-4">
          {events.map((event) => (
            <div key={`${event.typeSlug}-${event.id}`} className="rounded-lg border border-gray-200 p-4">
              <p className="text-lg font-semibold text-gray-900">{event.title}</p>
              <p className="mt-1 text-sm text-gray-700">{formatEventDate(event.startDateTime)}</p>
              <p className="text-sm text-gray-700">{event.storeName}</p>
              <p className="text-sm text-gray-600">{event.location}</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Link
                  href={event.displayUrl}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Event page →
                </Link>
                {event.externalUrl && event.externalUrl !== event.finderUrl ? (
                  <Link
                    href={event.finderUrl}
                    className="text-sm font-medium text-gray-700 hover:text-gray-900"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Official listing →
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-700">{emptyText}</p>
      )}
    </div>
  );
}

function formatEventDate(dateTime: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateTime));
}
