import { NextResponse } from "next/server";
import { getUid } from "@/lib/access/auth";
import {
    StoredLayerSchema,
    createStoredSchedule,
    deleteStoredSchedule,
    getStoredSchedule,
    listStoredSchedules,
    saveStoredSchedule,
    syncStoredSchedule,
} from "@/lib/schedule/storage";
import { v4 as uuidv4 } from "uuid";

export async function GET(req: Request) {
    try {
        const userId = getUid(req);
        const scheduleId = new URL(req.url).searchParams.get("scheduleId");
        if (!scheduleId) return NextResponse.json({ schedules: await listStoredSchedules(userId) });
        const schedule = await getStoredSchedule(userId, scheduleId);
        if (!schedule) return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
        return NextResponse.json({ schedule });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to load layers" },
            { status: 500 },
        );
    }
}

export async function POST(req: Request) {
    try {
        const userId = getUid(req);
        const body = await req.json();
        let schedule = body.scheduleId
            ? await getStoredSchedule(userId, body.scheduleId)
            : await createStoredSchedule(userId, body.name ?? "My Schedule");
        if (!schedule) return NextResponse.json({ error: "Schedule not found" }, { status: 404 });

        const layerInput = {
            id: body.layer?.id ?? uuidv4(),
            name: body.layer?.name ?? "Timetable",
            type: body.layer?.type ?? "none",
            enabled: body.layer?.enabled ?? true,
            ...(body.layer?.color ? { color: body.layer.color } : {}),
            ...(body.layer?.settings ? { settings: body.layer.settings } : {}),
            ...(body.layer?.source ? { source: body.layer.source } : {}),
        };
        const layer = StoredLayerSchema.parse(layerInput);
        schedule = await saveStoredSchedule(userId, {
            ...schedule,
            layers: [...schedule.layers.filter((item) => item.id !== layer.id), layer],
        });
        if (layer.type === "timetable" && layer.enabled) {
            schedule = await syncStoredSchedule(userId, schedule);
        }
        return NextResponse.json({
            schedule,
            layer: schedule.layers.find((item) => item.id === layer.id) ?? layer,
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to save layer" },
            { status: 400 },
        );
    }
}

export async function PATCH(req: Request) {
    try {
        const userId = getUid(req);
        const body = await req.json();
        if (body.scheduleId && !body.layerId && body.schedule) {
            const schedule = await getStoredSchedule(userId, body.scheduleId);
            if (!schedule)
                return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
            const updated = await saveStoredSchedule(userId, {
                ...schedule,
                ...body.schedule,
                id: schedule.id,
                layers: schedule.layers,
            });
            return NextResponse.json({ schedule: updated });
        }
        if (!body.scheduleId || !body.layerId) {
            return NextResponse.json({ error: "Missing scheduleId or layerId" }, { status: 400 });
        }
        const schedule = await getStoredSchedule(userId, body.scheduleId);
        if (!schedule) return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
        const existing = schedule.layers.find((item) => item.id === body.layerId);
        if (!existing) return NextResponse.json({ error: "Layer not found" }, { status: 404 });
        const layer = StoredLayerSchema.parse({
            ...existing,
            ...body.layer,
            id: existing.id,
            type: existing.type,
        });
        const updated = await saveStoredSchedule(userId, {
            ...schedule,
            layers: schedule.layers.map((item) => (item.id === layer.id ? layer : item)),
        });
        return NextResponse.json({ schedule: updated, layer });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to update layer" },
            { status: 400 },
        );
    }
}

export async function DELETE(req: Request) {
    try {
        const userId = getUid(req);
        const params = new URL(req.url).searchParams;
        const scheduleId = params.get("scheduleId");
        const layerId = params.get("layerId");
        if (!scheduleId) {
            return NextResponse.json({ error: "Missing scheduleId" }, { status: 400 });
        }
        if (!layerId) {
            const schedule = await getStoredSchedule(userId, scheduleId);
            if (!schedule)
                return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
            await deleteStoredSchedule(userId, scheduleId);
            return NextResponse.json({ deleted: true });
        }
        const schedule = await getStoredSchedule(userId, scheduleId);
        if (!schedule) return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
        const updated = await saveStoredSchedule(userId, {
            ...schedule,
            layers: schedule.layers.filter((item) => item.id !== layerId),
        });
        return NextResponse.json({ schedule: updated });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to delete layer" },
            { status: 500 },
        );
    }
}
