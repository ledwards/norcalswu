import { collectNormalizedEvents } from "./sources";
import { syncGoogleCalendar } from "./google-calendar";

export async function runCalendarSync(dryRun = false) {
  const { events, errors } = await collectNormalizedEvents();
  return syncGoogleCalendar(events, dryRun, errors);
}
