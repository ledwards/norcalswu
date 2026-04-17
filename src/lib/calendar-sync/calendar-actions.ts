import { DateTime } from "luxon";
import type { CalendarEventDateTime } from "./types";

const DEFAULT_TIMEZONE = "America/Los_Angeles";

export interface CalendarActionEvent {
  description?: string;
  end: CalendarEventDateTime;
  id: string;
  isAllDay: boolean;
  location?: string;
  start: CalendarEventDateTime;
  title: string;
  url?: string;
}

export function buildGoogleCalendarUrl(
  event: CalendarActionEvent,
  timezone = DEFAULT_TIMEZONE,
) {
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", event.title);
  url.searchParams.set("dates", buildGoogleDateRange(event, timezone));

  const details = buildCalendarDetails(event);
  if (details) {
    url.searchParams.set("details", details);
  }

  if (event.location) {
    url.searchParams.set("location", event.location);
  }

  if (!event.isAllDay) {
    url.searchParams.set("ctz", timezone);
  }

  return url.toString();
}

export function buildOutlookCalendarUrl(
  event: CalendarActionEvent,
  timezone = DEFAULT_TIMEZONE,
) {
  const url = new URL("https://outlook.live.com/calendar/0/deeplink/compose");
  const start = parseCalendarBoundary(event.start, timezone, event.isAllDay);
  const end = parseCalendarBoundary(event.end, timezone, event.isAllDay);

  url.searchParams.set("path", "/calendar/action/compose");
  url.searchParams.set("rru", "addevent");
  url.searchParams.set("subject", event.title);
  url.searchParams.set("startdt", event.isAllDay ? start.toISODate() || "" : start.toISO() || "");
  url.searchParams.set("enddt", event.isAllDay ? end.toISODate() || "" : end.toISO() || "");

  const body = buildCalendarDetails(event);
  if (body) {
    url.searchParams.set("body", body);
  }

  if (event.location) {
    url.searchParams.set("location", event.location);
  }

  if (event.isAllDay) {
    url.searchParams.set("allday", "true");
  }

  return url.toString();
}

export function buildAppleCalendarUrl(eventId: string) {
  return `/api/calendar/ics?id=${encodeURIComponent(eventId)}`;
}

export function buildIcsContent(
  event: CalendarActionEvent,
  timezone = DEFAULT_TIMEZONE,
) {
  const start = parseCalendarBoundary(event.start, timezone, event.isAllDay);
  const end = parseCalendarBoundary(event.end, timezone, event.isAllDay);
  const timestamp = DateTime.now().toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'");
  const details = buildCalendarDetails(event);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NorCal SWU//Community Calendar//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${escapeIcsText(event.id)}@norcalswu.com`,
    `DTSTAMP:${timestamp}`,
    event.isAllDay
      ? `DTSTART;VALUE=DATE:${start.toFormat("yyyyMMdd")}`
      : `DTSTART:${start.toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'")}`,
    event.isAllDay
      ? `DTEND;VALUE=DATE:${end.toFormat("yyyyMMdd")}`
      : `DTEND:${end.toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'")}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    event.location ? `LOCATION:${escapeIcsText(event.location)}` : undefined,
    details ? `DESCRIPTION:${escapeIcsText(details)}` : undefined,
    event.url ? `URL:${escapeIcsText(event.url)}` : undefined,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return `${lines.join("\r\n")}\r\n`;
}

function buildGoogleDateRange(event: CalendarActionEvent, timezone: string) {
  const start = parseCalendarBoundary(event.start, timezone, event.isAllDay);
  const end = parseCalendarBoundary(event.end, timezone, event.isAllDay);

  if (event.isAllDay) {
    return `${start.toFormat("yyyyMMdd")}/${end.toFormat("yyyyMMdd")}`;
  }

  return `${start.toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'")}/${end
    .toUTC()
    .toFormat("yyyyMMdd'T'HHmmss'Z'")}`;
}

function buildCalendarDetails(event: CalendarActionEvent) {
  return [event.description, event.url ? `More info: ${event.url}` : undefined]
    .filter(Boolean)
    .join("\n\n");
}

function parseCalendarBoundary(
  boundary: CalendarEventDateTime,
  timezone: string,
  isAllDay: boolean,
) {
  if (boundary.date) {
    return DateTime.fromISO(boundary.date, { zone: timezone });
  }

  if (boundary.dateTime) {
    return DateTime.fromISO(boundary.dateTime, { setZone: true }).setZone(timezone);
  }

  return isAllDay
    ? DateTime.now().setZone(timezone).startOf("day")
    : DateTime.now().setZone(timezone);
}

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}
