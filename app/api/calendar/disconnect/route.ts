/**
 * app/api/calendar/disconnect/route.ts — POST to remove the stored Google Calendar token.
 */

import { NextResponse } from "next/server";
import { authenticate, isAuthError } from "@/lib/ai/auth";
import { disconnectCalendar } from "@/lib/googleCalendar";

export const runtime = "nodejs";

export async function POST(req: Request) {
    const authResult = await authenticate(req);
    if (isAuthError(authResult)) return authResult.error;
    try {
        await disconnectCalendar(authResult.uid);
        return NextResponse.json({ connected: false, message: "Google Calendar disconnected." });
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Failed to disconnect" },
            { status: 500 },
        );
    }
}
