import { db } from "@/lib/firebaseAdmin";
import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import z from "zod";
import { GET as fetchTimetable } from "@/app/api/timetable/fetch/route";
import { getTimetableConfig } from "@/lib/firebaseSchema";
import { StandardTimetable } from "../timetableNormaliser";
import { calendarDay, calendarEvent, source, SourceActions, SourceCoverage } from "./types";
import { rangeFromDates, sourceCoversRange, translateTimetableData } from "./layers";

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

function compactSchedule(schedule: StoredSchedule): StoredSchedule {
    const layers = schedule.layers.map((layer) =>
        layer.type === "timetable"
            ? {
                  ...layer,
                  data: undefined,
                  source: layer.source ? { ...layer.source, data: [] } : undefined,
              }
            : layer,
    );
    return {
        ...schedule,
        layers,
        data: aggregateScheduleData(layers.filter((layer) => layer.type !== "timetable")),
    };
}

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

function enumerateDates(range: SourceCoverage): string[] {
    if (!range.from || !range.to) return [];
    const dates: string[] = [];
    const current = new Date(`${range.from}T00:00:00Z`);
    const end = new Date(`${range.to}T00:00:00Z`);
    while (current <= end) {
        dates.push(current.toISOString().slice(0, 10));
        current.setUTCDate(current.getUTCDate() + 1);
    }
    return dates;
}

function defaultTimetableRange(): SourceCoverage {
    const from = new Date();
    from.setUTCHours(0, 0, 0, 0);
    const start = new Date(from);
    start.setUTCDate(start.getUTCDate() - 7);
    const to = new Date(from);
    to.setUTCDate(to.getUTCDate() + 7);
    return {
        from: start.toISOString().slice(0, 10),
        to: to.toISOString().slice(0, 10),
    };
}

async function fetchTimetableRange(userId: string, range: SourceCoverage): Promise<void> {
    const requestedDates = enumerateDates(range);
    if (!requestedDates.length) return;

    for (let index = 0; index < requestedDates.length; index += 7) {
        const batch = requestedDates.slice(index, index + 7);
        const request = new NextRequest(
            new URL(
                batch.length === 7
                    ? `/api/timetable/fetch?week=${batch[0]}`
                    : `/api/timetable/fetch?day=${batch[0]}`,
                "http://internal.local",
            ),
            {
                method: "GET",
                headers: { "x-schoolm8-uid": userId },
            },
        );
        const response = await fetchTimetable(request);
        if (!response.ok) {
            throw new Error(`Failed to load timetable data for ${batch[0]}`);
        }
    }
}

export async function getMissingTimetableDates(
    userId: string,
    range: SourceCoverage,
): Promise<string[]> {
    const dates = enumerateDates(range);
    if (!dates.length) return [];

    const snapshot = await db.collection("timetable").doc(userId).collection("days").get();
    const now = Date.now();
    const available = new Set(
        snapshot.docs
            .filter((document) => {
                const expiry = document.data().expiry;
                return typeof expiry !== "number" || expiry > now;
            })
            .map((document) => document.id),
    );
    return dates.filter((date) => !available.has(date));
}

export async function getStoredSchedule(
    userId: string,
    scheduleId: string,
): Promise<StoredSchedule | null> {
    const document = await scheduleField(userId, scheduleId).get();
    if (!document.exists) return null;
    return compactSchedule(StoredScheduleSchema.parse({ id: document.id, ...document.data() }));
}

export async function listStoredSchedules(userId: string): Promise<StoredSchedule[]> {
    const snapshot = await db.collection("users").doc(userId).collection("schedules").get();
    return snapshot.docs.map((document) =>
        compactSchedule(StoredScheduleSchema.parse({ id: document.id, ...document.data() })),
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
    const persisted = compactSchedule(updated);
    await scheduleField(userId, schedule.id).set(removeUndefined(persisted));
    return updated;
}

export async function deleteStoredSchedule(userId: string, scheduleId: string): Promise<void> {
    await scheduleField(userId, scheduleId).delete();
}

export async function syncStoredSchedule(
    userId: string,
    schedule: StoredSchedule,
    range?: SourceCoverage,
): Promise<StoredSchedule> {
    const timetableConfig = await getTimetableConfig(userId);
    if (
        !timetableConfig ||
        !schedule.layers.some((layer) => layer.enabled && layer.type === "timetable")
    ) {
        return schedule;
    }
    await fetchTimetableRange(userId, range?.from && range?.to ? range : defaultTimetableRange());
    const timetableSnapshot = await db.collection("timetable").doc(userId).collection("days").get();
    const requestedDates = new Set(enumerateDates(range?.from && range?.to ? range : {}));
    const days = timetableSnapshot.docs.flatMap((document) => {
        if (requestedDates.size && !requestedDates.has(document.id)) return [];
        const parsed = StandardTimetable.safeParse(document.data());
        if (!parsed.success) {
            console.warn(`Ignoring invalid timetable document ${document.id}`);
            return [];
        }
        return [parsed.data];
    });
    if (!days.length) {
        return schedule;
    }
    const updatedLayers = schedule.layers.map((layer) => {
        if (layer.type !== "timetable" || !layer.enabled) return layer;
        const translated = translateTimetableData(layer.id, { days }, layer.settings, layer.name);
        const intervalMs = layer.source?.updateSchedule?.intervalMs;
        const source = {
            ...translated.source,
            updateSchedule: intervalMs
                ? { intervalMs, nextRunAt: Date.now() + intervalMs }
                : layer.source?.updateSchedule,
        };
        return {
            ...layer,
            source,
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

export function getStoredLayerSourceActions(
    userId: string,
    schedule: StoredSchedule,
    layerId: string,
): SourceActions | null {
    const layer = schedule.layers.find((item) => item.id === layerId);
    if (!layer?.source || layer.source.live) return null;

    const syncSource = async (range?: SourceCoverage) => {
        const updatedSchedule = await syncStoredSchedule(userId, schedule, range);
        const updatedLayer = updatedSchedule.layers.find((item) => item.id === layerId);
        if (!updatedLayer?.source) {
            throw new Error(`Source for layer ${layerId} was not produced during sync`);
        }
        return updatedLayer.source;
    };
    const updateTo = async (range: SourceCoverage) => {
        const updatedSchedule = await updateStoredScheduleTo(userId, schedule, range);
        const updatedLayer = updatedSchedule.layers.find((item) => item.id === layerId);
        if (!updatedLayer?.source) {
            throw new Error(`Source for layer ${layerId} was not produced during update`);
        }
        return updatedLayer.source;
    };

    return {
        sync: syncSource,
        updateTo,
    };
}

export async function updateStoredScheduleTo(
    userId: string,
    schedule: StoredSchedule,
    range: SourceCoverage,
): Promise<StoredSchedule> {
    const now = Date.now();
    const needsUpdate = schedule.layers.some((layer) => {
        if (!layer.enabled || layer.type !== "timetable") return false;
        if (!layer.source) return true;
        const scheduled = layer.source.updateSchedule?.nextRunAt;
        return (
            !layer.data?.length ||
            !sourceCoversRange(layer.source.coverage, range) ||
            (!layer.source.live && scheduled !== undefined && scheduled <= now)
        );
    });
    return needsUpdate ? syncStoredSchedule(userId, schedule, range) : schedule;
}

export function parseScheduleRange(params: URLSearchParams): SourceCoverage {
    return rangeFromDates(params.get("from") ?? undefined, params.get("to") ?? undefined);
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
