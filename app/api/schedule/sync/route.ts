import { NextResponse } from "next/server";
import { getUid } from "@/lib/access/auth";
import { getStoredSchedule, syncStoredSchedule } from "@/lib/schedule/storage";

export async function POST(req: Request) {
    try {
        const userId = getUid(req);
        const { scheduleId } = await req.json();
        if (!scheduleId) return NextResponse.json({ error: "Missing scheduleId" }, { status: 400 });
        const schedule = await getStoredSchedule(userId, scheduleId);
        if (!schedule) return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
        return NextResponse.json({ schedule: await syncStoredSchedule(userId, schedule) });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to sync schedule" },
            { status: 500 },
        );
    }
}
