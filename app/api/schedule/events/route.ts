import { NextResponse } from "next/server";
import { getUid } from "@/lib/access/auth";
import {
    getStoredSchedule,
    parseScheduleRange,
    updateStoredScheduleTo,
} from "@/lib/schedule/storage";

export async function GET(req: Request) {
    try {
        const userId = getUid(req);
        const scheduleId = new URL(req.url).searchParams.get("scheduleId");
        if (!scheduleId) return NextResponse.json({ error: "Missing scheduleId" }, { status: 400 });
        const loadedSchedule = await getStoredSchedule(userId, scheduleId);
        if (!loadedSchedule)
            return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
        const range = parseScheduleRange(new URL(req.url).searchParams);
        const schedule = await updateStoredScheduleTo(userId, loadedSchedule, range);
        return NextResponse.json({
            schedule,
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to load schedule events" },
            { status: 500 },
        );
    }
}
