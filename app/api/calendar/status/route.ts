/**
 * app/api/calendar/status/route.ts — GET whether Google Calendar is connected.
 */

import { NextResponse } from "next/server";
import { authenticate, isAuthError } from "@/lib/ai/auth";
import { getCalendarStatus } from "@/lib/googleCalendar";

export const runtime = "nodejs";

export async function GET(req: Request) {
    const authResult = await authenticate(req);
    if (isAuthError(authResult)) return authResult.error;
    try {
        return NextResponse.json(await getCalendarStatus(authResult.uid));
    } catch (err) {
        return NextResponse.json(
            { connected: false, error: err instanceof Error ? err.message : "error" },
            { status: 500 },
        );
    }
}
