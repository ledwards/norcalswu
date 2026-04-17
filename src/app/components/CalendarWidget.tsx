"use client";

import Link from "next/link";
import { DateTime } from "luxon";
import type { MouseEvent as ReactMouseEvent } from "react";
import { startTransition, useEffect, useState } from "react";
import {
  buildAppleCalendarUrl,
  buildGoogleCalendarUrl,
  buildOutlookCalendarUrl,
} from "../../lib/calendar-sync/calendar-actions";
import type {
  PublicCalendarEvent,
  PublicCalendarRegion,
} from "../../lib/calendar-sync/public-calendar";

const DEFAULT_TIMEZONE = "America/Los_Angeles";
const MAX_EVENTS_PER_DAY = 3;
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SOURCE_TYPE_META: Record<
  PublicCalendarEvent["sourceType"],
  { chipClassName: string; dotClassName: string; label: string; panelClassName: string }
> = {
  "official-swu": {
    chipClassName: "bg-amber-100 text-amber-900",
    dotClassName: "bg-amber-400",
    label: "Official Finder",
    panelClassName: "border-l-4 border-amber-400",
  },
  swuapi: {
    chipClassName: "bg-rose-100 text-rose-900",
    dotClassName: "bg-rose-400",
    label: "Melee Feed",
    panelClassName: "border-l-4 border-rose-400",
  },
  "tracked-page": {
    chipClassName: "bg-emerald-100 text-emerald-900",
    dotClassName: "bg-emerald-400",
    label: "Store Listing",
    panelClassName: "border-l-4 border-emerald-400",
  },
  "weekly-play": {
    chipClassName: "bg-sky-100 text-sky-900",
    dotClassName: "bg-sky-400",
    label: "Weekly Play",
    panelClassName: "border-l-4 border-sky-400",
  },
};
const IMPLEMENTATION_DESCRIPTION_PATTERNS = [
  /^Generated from the weekly play schedule/i,
  /^Imported from /i,
  /^Tracked store:/i,
  /^Matched to /i,
  /^Discovered on /i,
];
const DETAIL_LINK_LABELS: Record<string, string> = {
  "event page": "Event Page",
  "melee listing": "Melee Listing",
  "official listing": "Official Listing",
  "original listing": "Original Listing",
  "registration or store page": "Registration / Store Page",
};

interface CalendarWidgetProps {
  errors?: string[];
  events: PublicCalendarEvent[];
  regions: PublicCalendarRegion[];
  timezone?: string;
}

interface EventDetailLink {
  label: string;
  url: string;
}

interface CalendarActionLink {
  href: string;
  label: string;
}

interface HoverPreviewState {
  event: PublicCalendarEvent;
  left: number;
  top: number;
}

type CalendarViewMode = "month" | "week" | "day";

const VIEW_MODE_OPTIONS: Array<{ id: CalendarViewMode; label: string }> = [
  { id: "month", label: "Month" },
  { id: "week", label: "Week" },
  { id: "day", label: "Day" },
];

export default function CalendarWidget({
  errors = [],
  events,
  regions,
  timezone = DEFAULT_TIMEZONE,
}: CalendarWidgetProps) {
  const now = DateTime.now().setZone(timezone);
  const today = now.startOf("day");
  const [currentDate, setCurrentDate] = useState(today.toISODate() || "");
  const [hoverPreview, setHoverPreview] = useState<HoverPreviewState | null>(null);
  const [openDateKey, setOpenDateKey] = useState<string | null>(null);
  const [selectedRegionIds, setSelectedRegionIds] = useState(regions.map((region) => region.id));
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");

  useEffect(() => {
    if (!openDateKey) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenDateKey(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openDateKey]);

  const currentDateValue = DateTime.fromISO(currentDate, { zone: timezone }).startOf("day");
  const currentMonthDate = currentDateValue.startOf("month");
  const currentDateKey = currentDateValue.toISODate() || "";
  const openDateValue = openDateKey
    ? DateTime.fromISO(openDateKey, { zone: timezone }).startOf("day")
    : null;
  const filteredEvents = selectedRegionIds.length
    ? events.filter((event) => selectedRegionIds.includes(event.regionId))
    : [];
  const regionCounts = buildRegionEventCounts(events);
  const eventsByDate = buildEventsByDate(filteredEvents, timezone);
  const monthDays = buildMonthDays(currentMonthDate);
  const weekDays = buildWeekDays(currentDateValue);
  const currentDayEvents = sortEventsForDisplay(eventsByDate.get(currentDateKey) || [], timezone);
  const openDayEvents = openDateKey
    ? sortEventsForDisplay(eventsByDate.get(openDateKey) || [], timezone)
    : [];
  const allRegionsSelected = regions.length > 0 && selectedRegionIds.length === regions.length;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            Regions
          </span>
          <button
            type="button"
            onClick={() =>
              startTransition(() => {
                setSelectedRegionIds(allRegionsSelected ? [] : regions.map((region) => region.id));
              })
            }
            className="shrink-0 rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            {allRegionsSelected ? "Clear all" : "Select all"}
          </button>

          {regions.map((region) => {
            const isSelected = selectedRegionIds.includes(region.id);
            const count = regionCounts.get(region.id) || 0;

            return (
              <button
                key={region.id}
                type="button"
                onClick={() =>
                  startTransition(() => {
                    setSelectedRegionIds((current) =>
                      current.includes(region.id)
                        ? current.filter((id) => id !== region.id)
                        : [...current, region.id].sort(),
                    );
                  })
                }
                className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  isSelected
                    ? "border-[#463E3F] bg-[#463E3F] text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
                title={region.description}
              >
                {region.title}
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                    isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-2xl font-semibold text-gray-900">
            {formatCurrentRangeLabel(viewMode, currentDateValue)}
          </h3>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <div className="inline-flex rounded-full border border-gray-300 p-1">
              {VIEW_MODE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() =>
                    startTransition(() => {
                      setHoverPreview(null);
                      setViewMode(option.id);
                    })
                  }
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    option.id === viewMode
                      ? "bg-[#463E3F] text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                startTransition(() => {
                  setHoverPreview(null);
                  setCurrentDate(today.toISODate() || currentDate);
                })
              }
              className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => moveCurrentRange(-1)}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              aria-label={`Previous ${viewMode}`}
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => moveCurrentRange(1)}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              aria-label={`Next ${viewMode}`}
            >
              →
            </button>
          </div>
        </div>

        {viewMode === "month" ? (
          <>
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
              {WEEKDAY_LABELS.map((label) => (
                <div
                  key={label}
                  className="border-r border-gray-200 px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 last:border-r-0 sm:px-3 sm:text-xs"
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {monthDays.map((day) => {
                const dayKey = day.toISODate() || "";
                const dayEvents = sortEventsForDisplay(eventsByDate.get(dayKey) || [], timezone);
                const isCurrentMonth = day.hasSame(currentMonthDate, "month");
                const isToday = dayKey === today.toISODate();
                const isPastDay = day.endOf("day") < today;

                return (
                  <button
                    key={dayKey}
                    type="button"
                    onClick={() => openDate(day)}
                className={`min-h-[84px] overflow-hidden border-b border-r border-gray-200 px-2 py-2 text-left align-top transition-colors last:border-r-0 sm:min-h-[126px] sm:px-3 sm:py-3 lg:min-h-[150px] ${
                  isCurrentMonth ? "bg-white hover:bg-gray-50" : "bg-gray-50 hover:bg-gray-100"
                } ${isPastDay ? "text-gray-500" : ""}`}
              >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold sm:h-8 sm:w-8 ${
                          isToday
                            ? "bg-[#463E3F] text-white"
                            : isCurrentMonth
                              ? "text-gray-900"
                              : "text-gray-400"
                        }`}
                      >
                        {day.day}
                      </span>
                      {dayEvents.length ? (
                        <span className="text-[11px] font-medium text-gray-400 sm:text-xs">
                          {dayEvents.length}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1 sm:hidden">
                      {dayEvents.slice(0, MAX_EVENTS_PER_DAY).map((event) => {
                        const meta = SOURCE_TYPE_META[event.sourceType];
                        const isPastEvent = hasEventEnded(event, timezone, now);

                        return (
                          <span
                            key={`${dayKey}-${event.id}-dot`}
                            className={`h-2.5 w-2.5 rounded-full ${meta.dotClassName} ${
                              isPastEvent ? "opacity-40" : ""
                            }`}
                          />
                        );
                      })}
                      {dayEvents.length > MAX_EVENTS_PER_DAY ? (
                        <span className="text-[10px] font-medium text-gray-500">
                          +{dayEvents.length - MAX_EVENTS_PER_DAY}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-2 hidden space-y-1.5 sm:block">
                      {dayEvents.slice(0, MAX_EVENTS_PER_DAY).map((event) => {
                        const meta = SOURCE_TYPE_META[event.sourceType];
                        const isPastEvent = hasEventEnded(event, timezone, now);

                        return (
                          <div
                            key={`${dayKey}-${event.id}`}
                            onMouseEnter={(mouseEvent) => showHoverPreview(event, mouseEvent)}
                            onMouseMove={(mouseEvent) => showHoverPreview(event, mouseEvent)}
                            onMouseLeave={() => setHoverPreview(null)}
                            className={`truncate rounded-md px-2 py-1 text-[11px] font-medium sm:text-xs ${meta.chipClassName} ${
                              isPastEvent ? "opacity-60 grayscale" : ""
                            }`}
                            title={`${formatEventTimeRange(event, timezone)} ${event.title}`.trim()}
                          >
                            <span className="mr-1 font-semibold">
                              {event.isAllDay ? "All day" : formatEventStart(event, timezone)}
                            </span>
                            <span>{event.title}</span>
                          </div>
                        );
                      })}

                      {dayEvents.length > MAX_EVENTS_PER_DAY ? (
                        <p className="text-[11px] font-medium text-gray-500 sm:text-xs">
                          +{dayEvents.length - MAX_EVENTS_PER_DAY} more
                        </p>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        ) : null}

        {viewMode === "week" ? (
          <>
            <div className="divide-y divide-gray-200 md:hidden">
              {weekDays.map((day) => {
                const dayKey = day.toISODate() || "";
                const dayEvents = sortEventsForDisplay(eventsByDate.get(dayKey) || [], timezone);
                const isToday = dayKey === today.toISODate();
                const isFocusedDay = dayKey === currentDateKey;

                return (
                  <div key={dayKey} className={isFocusedDay ? "bg-blue-50/40" : "bg-white"}>
                    <button
                      type="button"
                      onClick={() => openDate(day)}
                      className="w-full border-b border-gray-200 px-4 py-3 text-left transition-colors hover:bg-gray-50"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                        {WEEKDAY_LABELS[day.weekday % 7]}
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <span
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                            isToday ? "bg-[#463E3F] text-white" : "text-gray-900"
                          }`}
                        >
                          {day.day}
                        </span>
                        <span className="text-sm text-gray-600">
                          {dayEvents.length} event{dayEvents.length === 1 ? "" : "s"}
                        </span>
                      </div>
                    </button>

                    <div className="space-y-2 p-3">
                      {dayEvents.length ? (
                        dayEvents.map((event) => {
                          const meta = SOURCE_TYPE_META[event.sourceType];
                          const isPastEvent = hasEventEnded(event, timezone, now);

                          return (
                            <button
                              key={`${dayKey}-${event.id}-mobile`}
                              type="button"
                              onClick={() => openDate(day)}
                              className={`w-full rounded-lg border border-gray-200 px-3 py-3 text-left transition-colors hover:bg-gray-50 ${meta.panelClassName} ${
                                isPastEvent ? "opacity-60" : ""
                              }`}
                            >
                              <p className="text-xs font-medium text-gray-500">
                                {formatEventTimeRange(event, timezone)}
                              </p>
                              <p className="mt-1 text-sm font-semibold text-gray-900">{event.title}</p>
                              {event.storeName ? (
                                <p className="mt-1 text-xs text-gray-600">{event.storeName}</p>
                              ) : null}
                            </button>
                          );
                        })
                      ) : (
                        <p className="text-sm text-gray-400">No events</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden md:grid md:grid-cols-7">
            {weekDays.map((day) => {
              const dayKey = day.toISODate() || "";
              const dayEvents = sortEventsForDisplay(eventsByDate.get(dayKey) || [], timezone);
              const isToday = dayKey === today.toISODate();
              const isFocusedDay = dayKey === currentDateKey;

              return (
                <div
                  key={dayKey}
                  className={`border-r border-gray-200 last:border-r-0 ${
                    isFocusedDay ? "bg-blue-50/40" : "bg-white"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => openDate(day)}
                    className="w-full border-b border-gray-200 px-2 py-3 text-center transition-colors hover:bg-gray-50 sm:px-3"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 sm:text-xs">
                      {WEEKDAY_LABELS[day.weekday % 7]}
                    </p>
                    <span
                      className={`mt-2 inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                        isToday ? "bg-[#463E3F] text-white" : "text-gray-900"
                      }`}
                    >
                      {day.day}
                    </span>
                  </button>

                  <div className="min-h-[360px] space-y-2 p-2 sm:p-3">
                    {dayEvents.length ? (
                      dayEvents.map((event) => {
                        const meta = SOURCE_TYPE_META[event.sourceType];
                        const isPastEvent = hasEventEnded(event, timezone, now);

                        return (
                          <button
                            key={`${dayKey}-${event.id}`}
                            type="button"
                            onClick={() => openDate(day)}
                            onMouseEnter={(mouseEvent) => showHoverPreview(event, mouseEvent)}
                            onMouseMove={(mouseEvent) => showHoverPreview(event, mouseEvent)}
                            onMouseLeave={() => setHoverPreview(null)}
                            className={`w-full rounded-lg border border-gray-200 px-2 py-2 text-left transition-colors hover:bg-gray-50 ${meta.panelClassName} ${
                              isPastEvent ? "opacity-60" : ""
                            }`}
                          >
                            <p className="text-[11px] font-medium text-gray-500 sm:text-xs">
                              {formatEventTimeRange(event, timezone)}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-gray-900">{event.title}</p>
                            {event.storeName ? (
                              <p className="mt-1 text-xs text-gray-600 sm:text-sm">{event.storeName}</p>
                            ) : null}
                          </button>
                        );
                      })
                    ) : (
                      <p className="text-xs text-gray-400 sm:text-sm">No events</p>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          </>
        ) : null}

        {viewMode === "day" ? (
          <div className="p-4 md:p-6">
            <div className="flex flex-col gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  {currentDayEvents.length} event{currentDayEvents.length === 1 ? "" : "s"}
                </p>
                <h4 className="mt-2 text-xl font-semibold text-gray-900">
                  {currentDateValue.toFormat("EEEE, LLLL d")}
                </h4>
              </div>
              {currentDayEvents.length ? (
                <button
                  type="button"
                  onClick={() => openDate(currentDateValue)}
                  className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Open details
                </button>
              ) : null}
            </div>

            <div className="mt-4 space-y-3">
              {currentDayEvents.length ? (
                currentDayEvents.map((event) => {
                  const meta = SOURCE_TYPE_META[event.sourceType];
                  const isPastEvent = hasEventEnded(event, timezone, now);

                  return (
                    <button
                      key={`${currentDateKey}-${event.id}`}
                      type="button"
                      onClick={() => openDate(currentDateValue)}
                      onMouseEnter={(mouseEvent) => showHoverPreview(event, mouseEvent)}
                      onMouseMove={(mouseEvent) => showHoverPreview(event, mouseEvent)}
                      onMouseLeave={() => setHoverPreview(null)}
                      className={`w-full rounded-xl border border-gray-200 bg-white px-4 py-4 text-left transition-colors hover:bg-gray-50 ${meta.panelClassName} ${
                        isPastEvent ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${meta.chipClassName}`}>
                          {meta.label}
                        </span>
                        <span className="text-xs font-medium text-gray-500">{event.regionTitle}</span>
                      </div>
                      <p className="mt-3 text-sm text-gray-600">{formatEventTimeRange(event, timezone)}</p>
                      <p className="mt-1 text-lg font-semibold text-gray-900">{event.title}</p>
                      {event.storeName ? <p className="mt-1 text-sm text-gray-700">{event.storeName}</p> : null}
                      {event.location ? <p className="mt-1 text-sm text-gray-600">{event.location}</p> : null}
                    </button>
                  );
                })
              ) : (
                <p className="text-sm text-gray-700">
                  {selectedRegionIds.length
                    ? "No events match the current filters on this day."
                    : "Select at least one region to see events."}
                </p>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {errors.length ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Some sources failed to refresh for this view.</p>
          <p className="mt-2">
            The calendar is still showing the events we were able to generate, but one or more
            upstream pages had issues while loading.
          </p>
        </div>
      ) : null}

      {hoverPreview ? (
        <div
          className="pointer-events-none fixed z-40 hidden w-[280px] rounded-xl border border-gray-200 bg-white p-4 shadow-2xl md:block"
          style={{ left: hoverPreview.left, top: hoverPreview.top }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            {SOURCE_TYPE_META[hoverPreview.event.sourceType].label}
          </p>
          <p className="mt-2 text-sm text-gray-600">
            {formatEventTimeRange(hoverPreview.event, timezone)}
          </p>
          <p className="mt-1 text-base font-semibold text-gray-900">{hoverPreview.event.title}</p>
          {hoverPreview.event.storeName ? (
            <p className="mt-1 text-sm text-gray-700">{hoverPreview.event.storeName}</p>
          ) : null}
          {hoverPreview.event.location ? (
            <p className="mt-1 text-sm text-gray-600">{hoverPreview.event.location}</p>
          ) : null}
        </div>
      ) : null}

      {openDateValue ? (
        <div
          className="fixed inset-0 z-50 bg-black/40 p-4 md:p-8"
          onClick={() => setOpenDateKey(null)}
        >
          <div
            className="mx-auto flex h-full max-h-[calc(100vh-2rem)] w-full max-w-[1200px] flex-col rounded-2xl bg-white shadow-2xl md:max-h-[calc(100vh-4rem)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-4 md:p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  {openDayEvents.length} event{openDayEvents.length === 1 ? "" : "s"}
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-gray-900">
                  {openDateValue.toFormat("EEEE, LLLL d")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpenDateKey(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-xl text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                aria-label="Close event details"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto p-4 md:p-6">
              {openDayEvents.length ? (
                <div className="space-y-4">
                  {openDayEvents.map((event) => {
                    const meta = SOURCE_TYPE_META[event.sourceType];
                    const storeName = getDisplayStoreName(event);
                    const detail = parseEventDetail(event);
                    const storeActionLinks = getStoreActionLinks(event);
                    const calendarActionLinks = getCalendarActionLinks(event, timezone);
                    const supplementalLocation = getSupplementalLocation(event);
                    const isPastEvent = hasEventEnded(event, timezone, now);

                    return (
                      <div
                        key={event.id}
                        className={`rounded-xl border border-gray-200 bg-white p-4 md:p-5 ${meta.panelClassName} ${
                          isPastEvent ? "opacity-60" : ""
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${meta.chipClassName}`}
                          >
                            {meta.label}
                          </span>
                          <span className="text-xs font-medium text-gray-500">{event.regionTitle}</span>
                          {isPastEvent ? (
                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                              Past event
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-3 text-lg font-semibold text-gray-900">{event.title}</p>
                        <p className="mt-1 text-sm text-gray-700">{formatEventTimeRange(event, timezone)}</p>
                        {storeName ? <p className="mt-1 text-sm text-gray-700">{storeName}</p> : null}
                        {event.store?.addressLine ? (
                          <p className="mt-1 text-sm text-gray-600">
                            <Link
                              href={event.store.googleMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-700 hover:text-blue-900 hover:underline"
                            >
                              {event.store.addressLine}
                            </Link>
                          </p>
                        ) : event.location ? (
                          <p className="mt-1 text-sm text-gray-600">{event.location}</p>
                        ) : null}
                        {supplementalLocation ? (
                          <p className="mt-1 text-sm text-gray-600">{supplementalLocation}</p>
                        ) : null}
                        {event.store?.phone ? (
                          <p className="mt-2 text-sm text-gray-700">
                            Phone:{" "}
                            <Link
                              href={`tel:${event.store.phone.replace(/\D/g, "")}`}
                              className="text-blue-700 hover:text-blue-900 hover:underline"
                            >
                              {event.store.phone}
                            </Link>
                          </p>
                        ) : null}
                        {event.store?.email ? (
                          <p className="mt-1 text-sm text-gray-700">
                            Email:{" "}
                            <Link
                              href={`mailto:${event.store.email}`}
                              className="text-blue-700 hover:text-blue-900 hover:underline"
                            >
                              {event.store.email}
                            </Link>
                          </p>
                        ) : null}

                        {detail.descriptionLines.length ? (
                          <div className="mt-3 space-y-2">
                            {detail.descriptionLines.map((line) => (
                              <p key={line} className="text-sm leading-6 text-gray-600">
                                {line}
                              </p>
                            ))}
                          </div>
                        ) : null}

                        {storeActionLinks.length ? (
                          <div className="mt-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                              Store Links
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {storeActionLinks.map((link) => (
                                <Link
                                  key={`${event.id}-store-${link.href}`}
                                  href={link.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                                >
                                  {link.label}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {detail.links.length ? (
                          <div className="mt-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                              Event Links
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {detail.links.map((link) => (
                                <Link
                                  key={`${event.id}-${link.url}`}
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
                                >
                                  {link.label}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        <div className="mt-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                            Add To Calendar
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {calendarActionLinks.map((link) => (
                              <Link
                                key={`${event.id}-calendar-${link.label}`}
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
                              >
                                {link.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-700">
                  {selectedRegionIds.length
                    ? "No events match the current filters on this day."
                    : "Select at least one region to see events."}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );

  function openDate(date: DateTime) {
    const dateKey = date.startOf("day").toISODate();
    if (!dateKey) {
      return;
    }

    startTransition(() => {
      setCurrentDate(dateKey);
      setHoverPreview(null);
      setOpenDateKey(dateKey);
    });
  }

  function moveCurrentRange(offset: number) {
    let nextDate = currentDateValue;

    if (viewMode === "month") {
      nextDate = currentDateValue.startOf("month").plus({ months: offset });
    } else if (viewMode === "week") {
      nextDate = currentDateValue.plus({ weeks: offset });
    } else {
      nextDate = currentDateValue.plus({ days: offset });
    }

    startTransition(() => {
      setHoverPreview(null);
      setCurrentDate(nextDate.toISODate() || currentDate);
    });
  }

  function showHoverPreview(event: PublicCalendarEvent, mouseEvent: ReactMouseEvent) {
    if (typeof window === "undefined") {
      return;
    }

    const tooltipWidth = 280;
    const tooltipHeight = 170;
    const viewportPadding = 16;
    const nextLeft = Math.min(
      mouseEvent.clientX + 18,
      window.innerWidth - tooltipWidth - viewportPadding,
    );
    const nextTop = Math.min(
      mouseEvent.clientY + 18,
      window.innerHeight - tooltipHeight - viewportPadding,
    );

    setHoverPreview({
      event,
      left: Math.max(viewportPadding, nextLeft),
      top: Math.max(viewportPadding, nextTop),
    });
  }
}

function buildRegionEventCounts(events: PublicCalendarEvent[]) {
  const counts = new Map<string, number>();

  for (const event of events) {
    counts.set(event.regionId, (counts.get(event.regionId) || 0) + 1);
  }

  return counts;
}

function buildEventsByDate(events: PublicCalendarEvent[], timezone: string) {
  const eventsByDate = new Map<string, PublicCalendarEvent[]>();

  for (const event of events) {
    for (const dateKey of getEventDateKeys(event, timezone)) {
      const existingEvents = eventsByDate.get(dateKey) || [];
      existingEvents.push(event);
      eventsByDate.set(dateKey, existingEvents);
    }
  }

  return eventsByDate;
}

function getEventDateKeys(event: PublicCalendarEvent, timezone: string) {
  const dateKeys: string[] = [];
  const start = parseEventBoundary(event.start, timezone, event.isAllDay).startOf("day");
  const end = parseEventBoundary(event.end, timezone, event.isAllDay);
  const lastVisibleDay = event.isAllDay
    ? end.minus({ days: 1 }).startOf("day")
    : end.minus({ millisecond: 1 }).startOf("day");

  let currentDay = start;
  while (currentDay <= lastVisibleDay) {
    const dateKey = currentDay.toISODate();
    if (dateKey) {
      dateKeys.push(dateKey);
    }
    currentDay = currentDay.plus({ days: 1 });
  }

  return dateKeys;
}

function parseEventBoundary(
  boundary: PublicCalendarEvent["start"] | PublicCalendarEvent["end"],
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

function buildMonthDays(month: DateTime) {
  const monthStart = month.startOf("month");
  const gridStart = startOfCalendarWeek(monthStart);

  return Array.from({ length: 42 }, (_, index) => gridStart.plus({ days: index }));
}

function buildWeekDays(date: DateTime) {
  const weekStart = startOfCalendarWeek(date);

  return Array.from({ length: 7 }, (_, index) => weekStart.plus({ days: index }));
}

function startOfCalendarWeek(date: DateTime) {
  return date.startOf("day").minus({ days: date.weekday % 7 });
}

function sortEventsForDisplay(events: PublicCalendarEvent[], timezone: string) {
  return [...events].sort((left, right) => {
    if (left.isAllDay !== right.isAllDay) {
      return left.isAllDay ? -1 : 1;
    }

    const leftStart = parseEventBoundary(left.start, timezone, left.isAllDay).toMillis();
    const rightStart = parseEventBoundary(right.start, timezone, right.isAllDay).toMillis();

    if (leftStart !== rightStart) {
      return leftStart - rightStart;
    }

    return left.title.localeCompare(right.title);
  });
}

function formatEventStart(event: PublicCalendarEvent, timezone: string) {
  return parseEventBoundary(event.start, timezone, event.isAllDay).toFormat("h:mm a");
}

function formatEventTimeRange(event: PublicCalendarEvent, timezone: string) {
  if (event.isAllDay) {
    const start = parseEventBoundary(event.start, timezone, true);
    const end = parseEventBoundary(event.end, timezone, true).minus({ days: 1 });

    if (start.hasSame(end, "day")) {
      return `All day • ${start.toFormat("MMM d")}`;
    }

    return `All day • ${start.toFormat("MMM d")} - ${end.toFormat("MMM d")}`;
  }

  const start = parseEventBoundary(event.start, timezone, false);
  const end = parseEventBoundary(event.end, timezone, false);

  if (start.hasSame(end, "day")) {
    return `${start.toFormat("h:mm a")} - ${end.toFormat("h:mm a")}`;
  }

  return `${start.toFormat("MMM d h:mm a")} - ${end.toFormat("MMM d h:mm a")}`;
}

function formatCurrentRangeLabel(viewMode: CalendarViewMode, currentDate: DateTime) {
  if (viewMode === "month") {
    return currentDate.startOf("month").toFormat("LLLL yyyy");
  }

  if (viewMode === "day") {
    return currentDate.toFormat("EEEE, LLLL d, yyyy");
  }

  const weekStart = startOfCalendarWeek(currentDate);
  const weekEnd = weekStart.plus({ days: 6 });

  if (weekStart.hasSame(weekEnd, "month")) {
    return `${weekStart.toFormat("LLLL d")} - ${weekEnd.toFormat("d, yyyy")}`;
  }

  if (weekStart.hasSame(weekEnd, "year")) {
    return `${weekStart.toFormat("LLL d")} - ${weekEnd.toFormat("LLL d, yyyy")}`;
  }

  return `${weekStart.toFormat("LLL d, yyyy")} - ${weekEnd.toFormat("LLL d, yyyy")}`;
}

function hasEventEnded(event: PublicCalendarEvent, timezone: string, now: DateTime) {
  const end = parseEventBoundary(event.end, timezone, event.isAllDay);
  return event.isAllDay ? end <= now.startOf("day") : end < now;
}

function getDisplayStoreName(event: PublicCalendarEvent) {
  if (!event.storeName) {
    return undefined;
  }

  if (event.location?.toLowerCase().includes(event.storeName.toLowerCase())) {
    return undefined;
  }

  return event.storeName;
}

function getSupplementalLocation(event: PublicCalendarEvent) {
  if (!event.location) {
    return undefined;
  }

  if (event.store?.addressLine && event.location.toLowerCase().includes(event.store.addressLine.toLowerCase())) {
    return undefined;
  }

  return event.location;
}

function getStoreActionLinks(event: PublicCalendarEvent): CalendarActionLink[] {
  const links = [
    event.store?.links.website
      ? {
          href: event.store.links.website,
          label: "Website",
        }
      : undefined,
    event.store?.links.onlineStore
      ? {
          href: event.store.links.onlineStore,
          label: "Store",
        }
      : undefined,
    event.store?.links.discord
      ? {
          href: event.store.links.discord,
          label: "Discord",
        }
      : undefined,
  ].filter(Boolean) as CalendarActionLink[];

  return links;
}

function getCalendarActionLinks(
  event: PublicCalendarEvent,
  timezone: string,
): CalendarActionLink[] {
  return [
    {
      href: buildGoogleCalendarUrl(event, timezone),
      label: "Google",
    },
    {
      href: buildOutlookCalendarUrl(event, timezone),
      label: "Outlook",
    },
    {
      href: buildAppleCalendarUrl(event.id),
      label: "Apple / iCal",
    },
    {
      href: buildAppleCalendarUrl(event.id),
      label: "ICS File",
    },
  ];
}

function parseEventDetail(event: PublicCalendarEvent): {
  descriptionLines: string[];
  links: EventDetailLink[];
} {
  const descriptionLines: string[] = [];
  const links = new Map<string, EventDetailLink>();
  const rawLines = (event.description || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of rawLines) {
    if (IMPLEMENTATION_DESCRIPTION_PATTERNS.some((pattern) => pattern.test(line))) {
      continue;
    }

    const link = parseDescriptionLink(line);
    if (link) {
      links.set(link.url, link);
      continue;
    }

    descriptionLines.push(line);
  }

  if (event.url) {
    const cleanUrl = normalizeUrl(event.url);
    if (cleanUrl && !links.has(cleanUrl)) {
      links.set(cleanUrl, {
        label: getPrimaryEventLinkLabel(event),
        url: cleanUrl,
      });
    }
  }

  return {
    descriptionLines,
    links: Array.from(links.values()),
  };
}

function parseDescriptionLink(line: string): EventDetailLink | null {
  const labeledMatch = line.match(/^([^:]+):\s*(https?:\/\/\S+)$/i);
  if (labeledMatch) {
    const url = normalizeUrl(labeledMatch[2]);
    if (!url) {
      return null;
    }

    return {
      label: formatDetailLinkLabel(labeledMatch[1]),
      url,
    };
  }

  const plainMatch = line.match(/^(https?:\/\/\S+)$/i);
  if (!plainMatch) {
    return null;
  }

  const url = normalizeUrl(plainMatch[1]);
  if (!url) {
    return null;
  }

  return {
    label: "View Event",
    url,
  };
}

function formatDetailLinkLabel(label: string) {
  const normalized = label.trim().toLowerCase();
  return DETAIL_LINK_LABELS[normalized] || label.trim();
}

function normalizeUrl(value: string) {
  const trimmed = value.trim().replace(/[),.;]+$/, "");
  return /^https?:\/\//i.test(trimmed) ? trimmed : "";
}

function getPrimaryEventLinkLabel(event: PublicCalendarEvent) {
  switch (event.sourceType) {
    case "weekly-play":
      return "Registration / Store Page";
    case "tracked-page":
      return "Store Listing";
    case "official-swu":
      return "Event Page";
    case "swuapi":
      return "Melee Listing";
    default:
      return "View Event";
  }
}
