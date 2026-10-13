import { NextResponse } from "next/server";
import { getUid } from "@/lib/access/auth";
import { listStoredSchedules } from "@/lib/schedule/storage";

export async function GET(req: Request) {
    try {
        const userId = getUid(req);
        const schedules = await listStoredSchedules(userId);

        return NextResponse.json({
            schedules: schedules.map(({ id, name, updated, layers, data }) => ({
                id,
                name,
                updated,
                layerCount: layers.length,
                eventCount: data.reduce((count, day) => count + day.events.length, 0),
            })),
        });
    } catch (error) {
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Failed to list schedules",
            },
            { status: 500 },
        );
    }
}
