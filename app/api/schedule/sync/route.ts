import { NextResponse } from "next/server";
import { getUid } from "@/lib/access/auth";
import { getStoredSchedule, parseScheduleRange, syncStoredSchedule } from "@/lib/schedule/storage";

export async function POST(req: Request) {
    try {
        const userId = getUid(req);
        const body = await req.json();
        const { scheduleId } = body;
        if (!scheduleId) return NextResponse.json({ error: "Missing scheduleId" }, { status: 400 });
        const schedule = await getStoredSchedule(userId, scheduleId);
        if (!schedule) return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
        const range =
            body.from || body.to
                ? { from: body.from, to: body.to }
                : parseScheduleRange(new URL(req.url).searchParams);
        return NextResponse.json({
            schedule: await syncStoredSchedule(userId, schedule, range),
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to sync schedule" },
            { status: 500 },
        );
    }
}
