import { NextResponse } from "next/server";
import { getUid } from "@/lib/access/auth";
import { calendarEvent } from "@/lib/schedule/types";
import { getStoredSchedule, saveStoredSchedule } from "@/lib/schedule/storage";
import { v4 as uuidv4 } from "uuid";

function eventDay(event: { start: string }): string {
    return event.start.slice(0, 10);
}

export async function POST(req: Request) {
    try {
        const userId = getUid(req);
        const body = await req.json();
        const schedule = await getStoredSchedule(userId, body.scheduleId);
        if (!schedule) return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
        const layer = schedule.layers.find((item) => item.id === body.layerId);
        if (!layer) return NextResponse.json({ error: "Layer not found" }, { status: 404 });
        if (layer.type === "timetable") {
            return NextResponse.json({ error: "Timetable layers are locked" }, { status: 403 });
        }
        const event = calendarEvent.parse({ ...body.event, id: body.event?.id ?? uuidv4() });
        const data = [...(layer.data ?? [])];
        const date = eventDay(event);
        const day = data.find((item) => item.date === date);
        if (day) day.events = [...day.events, event];
        else data.push({ date, timezone: event.timezone ?? "UTC", events: [event] });
        const updated = await saveStoredSchedule(userId, {
            ...schedule,
            layers: schedule.layers.map((item) =>
                item.id === layer.id ? { ...item, data } : item,
            ),
        });
        return NextResponse.json({ schedule: updated, event });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to create event" },
            { status: 400 },
        );
    }
}

export async function PATCH(req: Request) {
    try {
        const userId = getUid(req);
        const body = await req.json();
        const schedule = await getStoredSchedule(userId, body.scheduleId);
        if (!schedule) return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
        const layer = schedule.layers.find((item) => item.id === body.layerId);
        if (!layer) return NextResponse.json({ error: "Layer not found" }, { status: 404 });
        if (layer.type === "timetable") {
            return NextResponse.json({ error: "Timetable layers are locked" }, { status: 403 });
        }
        const replacement = calendarEvent.parse(body.event);
        const data = (layer.data ?? [])
            .map((day) => ({
                ...day,
                events: day.events.filter((event) => event.id !== replacement.id),
            }))
            .filter((day) => day.events.length > 0);
        const targetDay = data.find((day) => day.date === eventDay(replacement));
        if (targetDay) targetDay.events = [...targetDay.events, replacement];
        else
            data.push({
                date: eventDay(replacement),
                timezone: replacement.timezone ?? "UTC",
                events: [replacement],
            });
        const updated = await saveStoredSchedule(userId, {
            ...schedule,
            layers: schedule.layers.map((item) =>
                item.id === layer.id ? { ...item, data } : item,
            ),
        });
        return NextResponse.json({ schedule: updated, event: replacement });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to update event" },
            { status: 400 },
        );
    }
}

export async function DELETE(req: Request) {
    try {
        const userId = getUid(req);
        const params = new URL(req.url).searchParams;
        const schedule = await getStoredSchedule(userId, params.get("scheduleId") ?? "");
        if (!schedule) return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
        const layer = schedule.layers.find((item) => item.id === params.get("layerId"));
        if (!layer) return NextResponse.json({ error: "Layer not found" }, { status: 404 });
        if (layer.type === "timetable") {
            return NextResponse.json({ error: "Timetable layers are locked" }, { status: 403 });
        }
        const data = (layer.data ?? [])
            .map((day) => ({
                ...day,
                events: day.events.filter((event) => event.id !== params.get("eventId")),
            }))
            .filter((day) => day.events.length > 0);
        const updated = await saveStoredSchedule(userId, {
            ...schedule,
            layers: schedule.layers.map((item) =>
                item.id === layer.id ? { ...item, data } : item,
            ),
        });
        return NextResponse.json({ schedule: updated });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to delete event" },
            { status: 500 },
        );
    }
}
