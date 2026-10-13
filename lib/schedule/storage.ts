import { db } from "@/lib/firebaseAdmin";
import { v4 as uuidv4 } from "uuid";
import z from "zod";
import { calendarDay, calendarEvent, source } from "./types";
import { translateTimetableData } from "./layers";

export const StoredLayerSchema = z.object({
    id: z.string(),
    name: z.string(),
    color: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .optional(),
    type: z.enum(["timetable", "none"]),
    enabled: z.boolean().default(true),
    settings: z.record(z.string(), z.boolean()).optional(),
    source: source.optional(),
    data: z.array(calendarDay).optional(),
    updated: z.number().optional(),
});

export const StoredScheduleSchema = z.object({
    id: z.string(),
    name: z.string(),
    layers: z.array(StoredLayerSchema).default([]),
    data: z.array(calendarDay).default([]),
    updated: z.number().optional(),
});

export type StoredLayer = z.infer<typeof StoredLayerSchema>;
export type StoredSchedule = z.infer<typeof StoredScheduleSchema>;

function removeUndefined<T>(value: T): T {
    if (value === undefined) return undefined as T;
    if (Array.isArray(value)) {
        return value.filter((item) => item !== undefined).map((item) => removeUndefined(item)) as T;
    }
    if (value && typeof value === "object" && !(value instanceof Date)) {
        const result: Record<string, unknown> = {};
        for (const [key, nested] of Object.entries(value)) {
            if (nested !== undefined) result[key] = removeUndefined(nested);
        }
        return result as T;
    }
    return value;
}

function scheduleField(userId: string, scheduleId: string) {
    return db.collection("users").doc(userId).collection("schedules").doc(scheduleId);
}

export async function getStoredSchedule(
    userId: string,
    scheduleId: string,
): Promise<StoredSchedule | null> {
    const document = await scheduleField(userId, scheduleId).get();
    if (!document.exists) return null;
    return StoredScheduleSchema.parse({ id: document.id, ...document.data() });
}

export async function listStoredSchedules(userId: string): Promise<StoredSchedule[]> {
    const snapshot = await db.collection("users").doc(userId).collection("schedules").get();
    return snapshot.docs.map((document) =>
        StoredScheduleSchema.parse({ id: document.id, ...document.data() }),
    );
}

export async function createStoredSchedule(userId: string, name: string): Promise<StoredSchedule> {
    const schedule: StoredSchedule = {
        id: uuidv4(),
        name,
        layers: [],
        data: [],
        updated: Date.now(),
    };
    await scheduleField(userId, schedule.id).set(removeUndefined(schedule));
    return schedule;
}

export async function saveStoredSchedule(
    userId: string,
    schedule: StoredSchedule,
): Promise<StoredSchedule> {
    const updated = {
        ...schedule,
        data: aggregateScheduleData(schedule.layers),
        updated: Date.now(),
    };
    await scheduleField(userId, schedule.id).set(removeUndefined(updated), { merge: true });
    return updated;
}

export async function deleteStoredSchedule(userId: string, scheduleId: string): Promise<void> {
    await scheduleField(userId, scheduleId).delete();
}

export async function syncStoredSchedule(
    userId: string,
    schedule: StoredSchedule,
): Promise<StoredSchedule> {
    const timetableSnapshot = await db.collection("timetable").doc(userId).collection("days").get();
    const days = timetableSnapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
    }));
    const updatedLayers = schedule.layers.map((layer) => {
        if (layer.type !== "timetable" || !layer.enabled) return layer;
        const translated = translateTimetableData(layer.id, { days }, layer.settings, layer.name);
        return {
            ...layer,
            source: translated.source,
            data: translated.data,
            updated: Date.now(),
        };
    });
    return saveStoredSchedule(userId, {
        ...schedule,
        layers: updatedLayers,
        data: aggregateScheduleData(updatedLayers),
    });
}

export function flattenLayerEvents(layer: StoredLayer): z.infer<typeof calendarEvent>[] {
    const layerData = layer.data ?? [];
    return layerData.flatMap((day) =>
        day.events.map((event) =>
            calendarEvent.parse({
                ...event,
                extra: {
                    ...event.extra,
                    layerId: layer.id,
                    layerName: layer.name,
                    sourceId: layer.source?.id,
                    sourceName: layer.source?.name,
                    sourceType: layer.source?.source,
                },
            }),
        ),
    );
}

export function aggregateScheduleData(layers: StoredLayer[]): z.infer<typeof calendarDay>[] {
    const byDate = new Map<string, z.infer<typeof calendarDay>>();
    for (const layer of layers.filter((item) => item.enabled)) {
        for (const day of layer.data ?? []) {
            const existing = byDate.get(day.date) ?? {
                date: day.date,
                label: day.label,
                timezone: day.timezone,
                events: [],
            };
            existing.events.push(...flattenLayerEvents({ ...layer, data: [day] }));
            byDate.set(day.date, existing);
        }
    }
    return [...byDate.values()]
        .map((day) => ({
            ...day,
            events: day.events.sort((a, b) => a.start.localeCompare(b.start)),
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
}
