import { DocumentSnapshot } from "firebase/firestore";
import z from "zod";
import { StandardEvent, StandardTimetable, StandardWeek } from "../timetableNormaliser";
import { calendarDay, calendarEvent, layer, source as sourceSchema, SourceCoverage } from "./types";

// Timetable layer

export const defaultSettings = {
    combineDoublePeriods: true,
    locateRepeatingClasses: true,
    predictMissingClasses: true,
    markPredictedClasses: true,
    detectFortnightlyPatterns: true,
    avoidWeekendPredictions: true,
};

export type TimetableLayerSettings = typeof defaultSettings;
export type TimetableSource = z.infer<typeof sourceSchema>;
type Event = z.infer<typeof StandardEvent>;

function dateCoverage(dates: string[]): SourceCoverage {
    if (!dates.length) return {};
    const sorted = [...dates].sort();
    return { from: sorted[0], to: sorted.at(-1) };
}

export function sourceCoversRange(coverage: SourceCoverage, range: SourceCoverage): boolean {
    if (!range.from && !range.to) return true;
    if (!coverage.from || !coverage.to) return false;
    return (!range.from || coverage.from <= range.from) && (!range.to || coverage.to >= range.to);
}

export function rangeFromDates(from?: string, to?: string): SourceCoverage {
    for (const date of [from, to]) {
        if (date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            throw new Error("Source range dates must use YYYY-MM-DD format");
        }
    }
    if (from && to && from > to) {
        throw new Error("Source range start must not be after its end");
    }
    return { from, to };
}

function dayDifference(left: string, right: string): number {
    return Math.round(
        (Date.parse(right + "T00:00:00Z") - Date.parse(left + "T00:00:00Z")) / 86_400_000,
    );
}

function identity(event: Event): string {
    const timezone = event.timezone ?? "Australia/Sydney";
    const start = localTimeInZone(event.start, timezone);
    const end = localTimeInZone(event.end, timezone);
    return `${event.title}|${event.extra?.type ?? ""}|${event.extra?.period ?? ""}|${start}|${end}`.toLowerCase();
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
    const timezone = event.timezone ?? "Australia/Sydney";
    const startTime = localTimeInZone(event.start, timezone);
    const endTime = localTimeInZone(event.end, timezone);
    return {
        ...event,
        id: `${event.id}-${date}`,
        start: localDateTimeToISO(`${date}T${startTime}`, timezone),
        end: localDateTimeToISO(`${date}T${endTime}`, timezone),
        extra: {
            ...event.extra,
            status: settings.markPredictedClasses ? "Predicted" : event.extra?.status,
            predictionReason: "Repeated timetable pattern",
            patternIntervalDays: interval,
        },
    } satisfies z.infer<typeof calendarEvent>;
}

function localTimeInZone(value: string, timezone: string): string {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
    }).formatToParts(new Date(value));
    const values = new Map(parts.map((part) => [part.type, part.value]));
    return `${values.get("hour") ?? "00"}:${values.get("minute") ?? "00"}:${values.get("second") ?? "00"}`;
}

function localDateTimeToISO(value: string, timezone: string): string {
    const match = value.match(
        /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,6}))?)?/,
    );
    if (!match) throw new Error(`Invalid local timetable date-time: ${value}`);
    const [, year, month, day, hour, minute, second = "0", milliseconds = "0"] = match;
    const localMilliseconds = Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second),
        Number(milliseconds.slice(0, 3).padEnd(3, "0")),
    );
    const offsetAt = (timestamp: number): number => {
        const name = new Intl.DateTimeFormat("en-US", {
            timeZone: timezone,
            timeZoneName: "longOffset",
            year: "numeric",
        })
            .formatToParts(new Date(timestamp))
            .find((part) => part.type === "timeZoneName")?.value;
        const offset = name?.match(/GMT([+-])(\d{2}):?(\d{2})/);
        if (!offset) return 0;
        const minutes = Number(offset[2]) * 60 + Number(offset[3]);
        return (offset[1] === "+" ? 1 : -1) * minutes;
    };
    const guess = localMilliseconds - offsetAt(localMilliseconds) * 60_000;
    return new Date(localMilliseconds - offsetAt(guess) * 60_000).toISOString();
}

function locateRepeatingClasses(
    eventsByDate: Map<string, Event[]>,
    settings: TimetableLayerSettings,
): void {
    for (const [date, events] of eventsByDate) {
        eventsByDate.set(
            date,
            events.filter((event) => event.extra?.status !== "Predicted"),
        );
    }

    const occurrences = new Map<string, { date: string; event: Event }[]>();

    for (const [date, events] of eventsByDate) {
        for (const event of events) {
            if (event.extra?.status === "Predicted") continue;
            const entries = occurrences.get(identity(event)) ?? [];
            entries.push({ date, event });
            occurrences.set(identity(event), entries);
        }
    }

    for (const entries of occurrences.values()) {
        if (entries.length < 2) continue;
        entries.sort((left, right) => left.date.localeCompare(right.date));

        const dates = new Set(entries.map((entry) => entry.date));
        const weeklyPairs = entries.filter((entry) => dates.has(addDays(entry.date, 7))).length;
        const fortnightlyPairs = entries.filter((entry) =>
            dates.has(addDays(entry.date, 14)),
        ).length;
        const interval =
            settings.detectFortnightlyPatterns && fortnightlyPairs > weeklyPairs
                ? 14
                : weeklyPairs > 0
                  ? 7
                  : 0;
        if (!interval) continue;

        const actualDates = new Set(entries.map((entry) => entry.date));
        const loadedDates = [...eventsByDate.keys()].sort();
        const loadedFrom = loadedDates[0];
        const loadedTo = loadedDates.at(-1);
        const templateForDate = (date: string) =>
            entries.find((entry) => dayDifference(entry.date, date) % interval === 0)?.event;
        const hasContradiction =
            loadedFrom && loadedTo
                ? (() => {
                      for (
                          let timestamp = Date.parse(`${loadedFrom}T00:00:00Z`);
                          timestamp <= Date.parse(`${loadedTo}T00:00:00Z`);
                          timestamp += 86_400_000
                      ) {
                          const date = new Date(timestamp).toISOString().slice(0, 10);
                          if (actualDates.has(date)) continue;
                          const template = templateForDate(date);
                          if (!template) continue;
                          if (
                              (eventsByDate.get(date) ?? []).some(
                                  (event) =>
                                      event.extra?.status !== "Predicted" &&
                                      timesOverlap(event, template),
                              )
                          ) {
                              return true;
                          }
                      }
                      return false;
                  })()
                : false;
        if (hasContradiction) continue;

        const first = Date.parse(addDays(entries[0].date, -14) + "T00:00:00Z");
        const last = Date.parse(addDays(entries.at(-1)!.date, 14) + "T00:00:00Z");

        for (
            let timestamp = first + interval * 86_400_000;
            timestamp < last;
            timestamp += interval * 86_400_000
        ) {
            const date = new Date(timestamp).toISOString().slice(0, 10);
            if (actualDates.has(date)) continue;
            const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
            const template = templateForDate(date);
            if (settings.avoidWeekendPredictions && (weekday === 0 || weekday === 6)) continue;

            if (!template) continue;

            const events = eventsByDate.get(date) ?? [];
            const hasActualOverlap = events.some(
                (existing) =>
                    existing.extra?.status !== "Predicted" && timesOverlap(existing, template),
            );
            if (hasActualOverlap) continue;
            if (
                events.some(
                    (existing) =>
                        existing.extra?.status === "Predicted" && timesOverlap(existing, template),
                )
            )
                continue;
            events.push(predictedEvent(template, date, interval, settings));
            eventsByDate.set(date, events);
        }
    }
}

function minutes(value: string, timezone = "Australia/Sydney"): number {
    const time = value.includes("T") ? localTimeInZone(value, timezone) : value;
    const [hours, minute] = time.slice(0, 5).split(":").map(Number);
    return hours * 60 + minute;
}

function timesOverlap(left: Event, right: Event): boolean {
    const timezone = left.timezone ?? right.timezone ?? "Australia/Sydney";
    return (
        minutes(left.start, timezone) < minutes(right.end, timezone) &&
        minutes(right.start, timezone) < minutes(left.end, timezone)
    );
}

function addDays(date: string, days: number): string {
    const value = new Date(`${date}T00:00:00Z`);
    value.setUTCDate(value.getUTCDate() + days);
    return value.toISOString().slice(0, 10);
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
        live: false,
        coverage: dateCoverage(days.map((day) => day.date)),
        lastSyncedAt: Date.now(),
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
