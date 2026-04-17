import { NextRequest, NextResponse } from "next/server";
import { buildIcsContent } from "../../../../lib/calendar-sync/calendar-actions";
import { getPublicCalendarData } from "../../../../lib/calendar-sync/public-calendar";

export async function GET(request: NextRequest) {
  const eventId = request.nextUrl.searchParams.get("id")?.trim();
  if (!eventId) {
    return NextResponse.json({ error: "Missing event id." }, { status: 400 });
  }

  const { events } = await getPublicCalendarData();
  const event = events.find((candidate) => candidate.id === eventId);

  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const ics = buildIcsContent(event);
  const filename = buildFileName(event.title);

  return new NextResponse(ics, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "text/calendar; charset=utf-8",
    },
  });
}

function buildFileName(title: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${slug || "norcalswu-event"}.ics`;
}
