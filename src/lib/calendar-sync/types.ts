export interface CalendarEventDateTime {
  date?: string;
  dateTime?: string;
  timeZone?: string;
}

export interface NormalizedCalendarEvent {
  sourceUid: string;
  sourceType: "weekly-play" | "tracked-page" | "official-swu" | "swuapi";
  sourceLabel: string;
  storeId?: string;
  title: string;
  description?: string;
  location?: string;
  url?: string;
  start: CalendarEventDateTime;
  end: CalendarEventDateTime;
}

export interface SyncSummary {
  generatedEventCount: number;
  insertedCount: number;
  updatedCount: number;
  deletedCount: number;
  skippedCount: number;
  dryRun: boolean;
  errors: string[];
}
