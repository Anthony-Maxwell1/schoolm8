import { DocumentSnapshot } from "firebase/firestore";
import { Frequency } from "rrule";
import z from "zod";
import { StandardEvent, StandardTimetable, StandardWeek } from "../timetableNormaliser";
import { calendarDay, calendarEvent, layer, source as sourceSchema } from "./types";

// Timetable layer

export const defaultSettings = {
    combineDoublePeriods: true,
    locateRepeatingClasses: true,
    predictMissingClasses: true,
    markPredictedClasses: true,
};

export type TimetableLayerSettings = typeof defaultSettings;
export type TimetableSource = z.infer<typeof sourceSchema>;
type Event = z.infer<typeof StandardEvent>;

function dayDifference(left: string, right: string): number {
    return Math.round(
        (Date.parse(right + "T00:00:00Z") - Date.parse(left + "T00:00:00Z")) / 86_400_000,
    );
}

function identity(event: Event): string {
    return `${event.title}|${event.extra?.period ?? ""}`.toLowerCase();
}

function sameClassProperties(left: Event, right: Event): boolean {
    const leftExtra = left.extra ?? {};
    const rightExtra = right.extra ?? {};
    return (
        left.title === right.title &&
        left.description === right.description &&
        left.allDay === right.allDay &&
        left.timezone === right.timezone &&
        leftExtra.type === rightExtra.type &&
        leftExtra.room === rightExtra.room &&
        leftExtra.teacher === rightExtra.teacher &&
        JSON.stringify(leftExtra.links ?? []) === JSON.stringify(rightExtra.links ?? [])
    );
}

function combineDoublePeriods(events: Event[]): Event[] {
    const sorted = [...events].sort((left, right) => left.start.localeCompare(right.start));
    const combined: Event[] = [];

    for (const event of sorted) {
        const previous = combined.at(-1);
        if (
            previous &&
            previous.extra?.type !== "event" &&
            event.extra?.type !== "event" &&
            previous.end === event.start &&
            sameClassProperties(previous, event)
        ) {
            const periods = [previous.extra?.period, event.extra?.period].filter(
                (period): period is string => Boolean(period),
            );
            combined[combined.length - 1] = {
                ...previous,
                end: event.end,
                extra: {
                    ...previous.extra,
                    period: periods.length ? [...new Set(periods)].join("-") : undefined,
                },
            };
        } else {
            combined.push(event);
        }
    }

    return combined;
}

function predictedEvent(
    event: Event,
    date: string,
    interval: number,
    settings: TimetableLayerSettings,
): Event {
    const startTime = event.start.slice(11);
    const endTime = event.end.slice(11);
    return {
        ...event,
        id: `${event.id}-${date}`,
        start: new Date(Date.parse(`${date}T${startTime}`)).toISOString(),
        end: new Date(Date.parse(`${date}T${endTime}`)).toISOString(),
        extra: {
            ...event.extra,
            status: settings.markPredictedClasses ? "Predicted" : event.extra?.status,
        },
        recurrence: {
            freq: interval === 7 ? Frequency.WEEKLY : Frequency.DAILY,
            interval,
        },
    } satisfies z.infer<typeof calendarEvent>;
}

function locateRepeatingClasses(
    eventsByDate: Map<string, Event[]>,
    settings: TimetableLayerSettings,
): void {
    const occurrences = new Map<string, { date: string; event: Event }[]>();

    for (const [date, events] of eventsByDate) {
        for (const event of events) {
            if (event.extra?.type === "event") continue;
            const entries = occurrences.get(identity(event)) ?? [];
            entries.push({ date, event });
            occurrences.set(identity(event), entries);
        }
    }

    for (const entries of occurrences.values()) {
        if (entries.length < 2) continue;
        entries.sort((left, right) => left.date.localeCompare(right.date));

        const intervals = entries
            .slice(1)
            .map((entry, index) => dayDifference(entries[index].date, entry.date))
            .filter((interval) => interval > 0);
        if (!intervals.length) continue;

        const interval = intervals.sort((left, right) => left - right)[
            Math.floor(intervals.length / 2)
        ];
        const actualDates = new Set(entries.map((entry) => entry.date));
        const first = Date.parse(entries[0].date + "T00:00:00Z");
        const last = Date.parse(entries.at(-1)!.date + "T00:00:00Z");

        for (
            let timestamp = first + interval * 86_400_000;
            timestamp < last;
            timestamp += interval * 86_400_000
        ) {
            const date = new Date(timestamp).toISOString().slice(0, 10);
            if (actualDates.has(date)) continue;

            const template = entries.find(
                (entry) => dayDifference(entry.date, date) % interval === 0,
            )?.event;
            if (!template) continue;

            const events = eventsByDate.get(date) ?? [];
            events.push(predictedEvent(template, date, interval, settings));
            eventsByDate.set(date, events);
        }
    }
}

export function translateTimetable(
    snapshot: DocumentSnapshot,
    settings: Partial<TimetableLayerSettings> = {},
    name = "Timetable",
): { source: TimetableSource; data: z.infer<typeof calendarDay>[] } {
    if (!snapshot.exists()) {
        throw new Error(`Timetable document ${snapshot.id} does not exist`);
    }

    return translateTimetableData(snapshot.id, snapshot.data(), settings, name);
}

export function translateTimetableData(
    id: string,
    rawData: unknown,
    settings: Partial<TimetableLayerSettings> = {},
    name = "Timetable",
): { source: TimetableSource; data: z.infer<typeof calendarDay>[] } {
    const parsedWeek = StandardWeek.safeParse(rawData);
    const parsedDay = StandardTimetable.safeParse(rawData);
    const days = parsedWeek.success
        ? parsedWeek.data.days
        : parsedDay.success
          ? [parsedDay.data]
          : null;

    if (!days) {
        throw new Error(`Timetable document ${id} is not a timetable day or week`);
    }
    const resolvedSettings = { ...defaultSettings, ...settings };

    const eventsByDate = new Map<string, Event[]>(
        days.map((day) => [day.date, day.events.map((event) => StandardEvent.parse(event))]),
    );
    if (resolvedSettings.combineDoublePeriods) {
        for (const [date, events] of eventsByDate) {
            eventsByDate.set(date, combineDoublePeriods(events));
        }
    }
    if (resolvedSettings.locateRepeatingClasses && resolvedSettings.predictMissingClasses) {
        locateRepeatingClasses(eventsByDate, resolvedSettings);
    }

    const data = [...eventsByDate.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([date, events]) =>
            calendarDay.parse({
                date,
                timezone: days.find((day) => day.date === date)?.timezone ?? "UTC",
                label: days.find((day) => day.date === date)?.label,
                events,
            }),
        );
    const sourceData = data.flatMap((day) => day.events);

    const timetableSource = {
        id,
        name,
        data: sourceData,
        source: "firebase-live",
    };
    return {
        source: sourceSchema.parse(timetableSource),
        data,
    };
}

export function timetableSourceToLayer(
    source: TimetableSource,
    data: z.infer<typeof calendarDay>[],
): z.infer<typeof layer> {
    return layer.parse({
        id: source.id,
        name: source.name,
        pull: [source],
        push: [],
        data,
    });
}
