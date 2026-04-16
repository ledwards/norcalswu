import Link from "next/link";
import ContentCard from "./ContentCard";

const DATE_ONLY_PATTERN = /^(\d{4}-\d{2}-\d{2})$/;
const MIDNIGHT_UTC_PATTERN = /^(\d{4}-\d{2}-\d{2})T00:00:00(?:\.000)?Z$/;
const DATE_ONLY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export interface HighlightedEvent {
  dateLabel?: string;
  dateValue: string;
  key: string;
  location: string;
  primaryUrl?: string;
  secondaryUrl?: string;
  subtitle: string;
  title: string;
}

interface EventHighlightsCardProps {
  emptyText: string;
  events: HighlightedEvent[];
  title: string;
}

export default function EventHighlightsCard({
  emptyText,
  events,
  title,
}: EventHighlightsCardProps) {
  return (
    <ContentCard title={title}>
      {events.length ? (
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.key} className="rounded-lg border border-gray-200 p-4">
              <p className="text-lg font-semibold text-gray-900">{event.title}</p>
              <p className="mt-1 text-sm text-gray-700">
                {event.dateLabel || formatEventDate(event.dateValue)}
              </p>
              <p className="text-sm text-gray-700">{event.subtitle}</p>
              <p className="text-sm text-gray-600">{event.location}</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {event.primaryUrl ? (
                  <Link
                    href={event.primaryUrl}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Event page →
                  </Link>
                ) : null}
                {event.secondaryUrl ? (
                  <Link
                    href={event.secondaryUrl}
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
    </ContentCard>
  );
}

function formatEventDate(dateTime: string) {
  const dateOnlyMatch = dateTime.match(DATE_ONLY_PATTERN);
  if (dateOnlyMatch) {
    return formatDateAtLocalNoon(dateOnlyMatch[1]);
  }

  const midnightUtcMatch = dateTime.match(MIDNIGHT_UTC_PATTERN);
  if (midnightUtcMatch) {
    return formatDateAtLocalNoon(midnightUtcMatch[1]);
  }

  return DATE_TIME_FORMATTER.format(new Date(dateTime));
}

function formatDateAtLocalNoon(date: string) {
  return DATE_ONLY_FORMATTER.format(new Date(`${date}T12:00:00`));
}
