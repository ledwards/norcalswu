import { NextRequest, NextResponse } from "next/server";
import { runCalendarSync } from "../../../../lib/calendar-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = request.nextUrl.searchParams.get("dryRun") === "1";

  try {
    const result = await runCalendarSync(dryRun);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Calendar sync failed",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET || process.env.CALENDAR_SYNC_SECRET;

  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  const authorization = request.headers.get("authorization");
  if (authorization === `Bearer ${secret}`) {
    return true;
  }

  return request.nextUrl.searchParams.get("secret") === secret;
}
