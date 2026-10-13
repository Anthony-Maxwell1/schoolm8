import { NextResponse } from "next/server";
import { getUid } from "@/lib/access/auth";
import { getStoredSchedule } from "@/lib/schedule/storage";

export async function GET(req: Request) {
    try {
        const userId = getUid(req);
        const scheduleId = new URL(req.url).searchParams.get("scheduleId");
        if (!scheduleId) return NextResponse.json({ error: "Missing scheduleId" }, { status: 400 });
        const schedule = await getStoredSchedule(userId, scheduleId);
        if (!schedule) return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
        return NextResponse.json({
            scheduleId: schedule.id,
            name: schedule.name,
            updated: schedule.updated,
            data: schedule.data,
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to load schedule events" },
            { status: 500 },
        );
    }
}
