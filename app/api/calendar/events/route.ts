/**
 * app/api/calendar/events/route.ts
 *
 * GET  → list the user's events in a date range as busy intervals (for the scheduler)
 * POST → create events on the user's primary calendar (push a study plan)
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticate, isAuthError } from "@/lib/ai/auth";
import { createCalendarEvents, listBusyEvents } from "@/lib/googleCalendar";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
    const authResult = await authenticate(req);
    if (isAuthError(authResult)) return authResult.error;

    const url = new URL(req.url);
    const start = url.searchParams.get("start") ?? new Date().toISOString().slice(0, 10);
    const days = Math.min(31, Math.max(1, Number(url.searchParams.get("days")) || 14));

    const timeMin = new Date(start + "T00:00:00.000Z").toISOString();
    const timeMax = new Date(new Date(timeMin).getTime() + days * 86400000).toISOString();

    try {
        const { busy, events } = await listBusyEvents(authResult.uid, timeMin, timeMax);
        return NextResponse.json({ connected: true, busy, events });
    } catch (err) {
        if (err instanceof Error && err.message === "not_connected") {
            return NextResponse.json({ connected: false, busy: [], events: [] }, { status: 409 });
        }
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Failed to read calendar" },
            { status: 500 },
        );
    }
}

const eventSchema = z.object({
    summary: z.string().min(1).max(300),
    description: z.string().max(2000).optional(),
    start: z.string(),
    end: z.string(),
    timeZone: z.string().max(64).optional(),
    recurrence: z.array(z.string().max(200)).max(5).optional(),
});

const postSchema = z.object({ events: z.array(eventSchema).min(1).max(100) });

export async function POST(req: Request) {
    const authResult = await authenticate(req);
    if (isAuthError(authResult)) return authResult.error;

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.issues[0]?.message ?? "Invalid request" },
            { status: 400 },
        );
    }

    try {
        const result = await createCalendarEvents(authResult.uid, parsed.data.events);
        return NextResponse.json({ ...result, message: `Added ${result.created} to Google Calendar.` });
    } catch (err) {
        if (err instanceof Error && err.message === "not_connected") {
            return NextResponse.json(
                { error: "Connect Google Calendar first in Settings → Integrations." },
                { status: 409 },
            );
        }
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Failed to add events" },
            { status: 500 },
        );
    }
}
