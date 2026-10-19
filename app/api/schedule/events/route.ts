import { NextRequest, NextResponse } from "next/server";
import { getUid } from "@/lib/access/auth";
import {
    getMissingTimetableDates,
    getStoredSchedule,
    parseScheduleRange,
    updateStoredScheduleTo,
} from "@/lib/schedule/storage";
import { GET as fetchTimetableDay } from "@/app/api/timetable/fetch/route";

export async function GET(req: Request) {
    try {
        const userId = getUid(req);
        const scheduleId = new URL(req.url).searchParams.get("scheduleId");
        if (!scheduleId) return NextResponse.json({ error: "Missing scheduleId" }, { status: 400 });
        const loadedSchedule = await getStoredSchedule(userId, scheduleId);
        if (!loadedSchedule)
            return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
        const range = parseScheduleRange(new URL(req.url).searchParams);
        const missingDates = loadedSchedule.layers.some(
            (layer) => layer.enabled && layer.type === "timetable",
        )
            ? await getMissingTimetableDates(userId, range)
            : [];

        for (const date of missingDates) {
            const timetableRequest = new NextRequest(
                new URL(`/api/timetable/fetch?day=${date}`, req.url),
                {
                    method: "GET",
                    headers: { "x-schoolm8-uid": userId },
                },
            );
            const timetableResponse = await fetchTimetableDay(timetableRequest);
            if (!timetableResponse.ok) {
                throw new Error(`Failed to load timetable data for ${date}`);
            }
        }

        const schedule = await updateStoredScheduleTo(userId, loadedSchedule, range);
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
