// /lib/timetableNormaliser.ts

import { calendarDay, calendarEvent, ISODateString } from "./schedule/types";
import z from "zod";

/* =========================================================
   TYPES
========================================================= */

const timetableExtra = z
    .object({
        type: z.enum(["class", "event", "break", "other"]).optional(),
        period: z.string().optional(),
        room: z.string().optional(),
        teacher: z.string().optional(),
        links: z
            .array(
                z.object({
                    label: z.string(),
                    url: z.string(),
                }),
            )
            .optional(),
        status: z.string().optional(),
        raw: z.unknown().optional(),
    })
    .catchall(z.unknown());

export const StandardEvent = calendarEvent.extend({
    extra: timetableExtra.optional(),
});

export const StandardTimetable = calendarDay.extend({
    date: ISODateString,
    source: z.enum(["edumate", "ical"]),
    events: z.array(StandardEvent),
});

export type StandardTimetable = z.infer<typeof StandardTimetable>;
export type StandardEvent = z.infer<typeof StandardEvent>;

export const StandardWeek = z.object({
    days: z.array(StandardTimetable),
});

export type StandardWeek = z.infer<typeof StandardWeek>;

/* =========================================================
   HELPERS
========================================================= */

export function isValidISODate(input: string): boolean {
    return ISODateString.safeParse(input).success;
}

export function stripHtml(input?: string): string {
    return input?.replace(/<[^>]*>/g, "") ?? "";
}

export function toISO(dateStr: string, timezone = "Australia/Sydney"): string {
    const value = dateStr.trim();
    if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(value)) {
        return new Date(value).toISOString();
    }

    const match = value.match(
        /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,6}))?)?$/,
    );
    if (!match) {
        throw new Error(`Invalid timetable date-time: ${dateStr}`);
    }

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

    const getOffset = (timestamp: number): number => {
        const parts = new Intl.DateTimeFormat("en-US", {
            timeZone: timezone,
            timeZoneName: "longOffset",
            year: "numeric",
        }).formatToParts(new Date(timestamp));
        const offset = parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT";
        const offsetMatch = offset.match(/GMT([+-])(\d{2}):?(\d{2})/);
        if (!offsetMatch) return 0;
        const minutes = Number(offsetMatch[2]) * 60 + Number(offsetMatch[3]);
        return offsetMatch[1] === "+" ? minutes : -minutes;
    };

    const firstGuess = localMilliseconds - getOffset(localMilliseconds) * 60_000;
    const corrected = localMilliseconds - getOffset(firstGuess) * 60_000;
    return new Date(corrected).toISOString();
}

export function inferEventType(summary?: string): z.infer<typeof timetableExtra>["type"] {
    if (!summary) return "other";

    const s = summary.toLowerCase();

    if (s.includes("period") || s.includes("lesson") || s.includes("class")) return "class";

    if (s.includes("break") || s.includes("recess") || s.includes("lunch")) return "break";

    return "event";
}

export function getWeekDates(startDate: string): string[] {
    const [year, month, day] = startDate.split("-").map(Number);
    const base = new Date(Date.UTC(year, month - 1, day));
    const dates: string[] = [];

    for (let i = 0; i < 7; i++) {
        const d = new Date(base);
        d.setUTCDate(day + i);
        dates.push(d.toISOString().slice(0, 10));
    }

    return dates;
}

/* =========================================================
   EDUMATE NORMALISER
========================================================= */

export function normaliseEdumateDay(edumate: any): StandardTimetable {
    const timezone = edumate?.events?.[0]?.startDateTime?.timezone ?? "Australia/Sydney";

    return {
        source: "edumate",
        date: edumate.SQLDate,
        label: stripHtml(edumate.label),
        timezone,
        events: (edumate.events || []).map((event: any, index: number) => ({
            id: `${edumate.SQLDate}-${index}`,
            title: event.activityName,
            start: toISO(event.startDateTime.date, timezone),
            end: toISO(event.endDateTime.date, timezone),
            timezone,
            description: event.displayTime,
            extra: {
                type: event.eventType,
                period: event.period,
                room: event.room?.replace(/[()]/g, "").trim(),
                links: (event.links || []).map((l: any) => ({
                    label: stripHtml(l.text),
                    url: l.href,
                })),
                raw: event,
            },
        })),
    };
}

export async function normaliseEdumateWeek(
    fetchDay: (date: string) => Promise<any>,
    startDate: string,
): Promise<StandardWeek> {
    if (!isValidISODate(startDate)) {
        throw new Error("Week start must be YYYY-MM-DD");
    }

    const dates = getWeekDates(startDate);

    const days: StandardTimetable[] = [];

    for (const date of dates) {
        const dayData = await fetchDay(date);
        days.push(normaliseEdumateDay(dayData));
    }

    return { days };
}

/* =========================================================
   ICAL NORMALISER
========================================================= */

export function normaliseICalDay(
    parsedEvents: any[],
    date: string,
    timezone = "UTC",
): StandardTimetable {
    return {
        source: "ical",
        date,
        timezone,
        events: parsedEvents.map((event: any) => ({
            id: event.uid,
            title: event.summary,
            start: new Date(event.start).toISOString(),
            end: new Date(event.end).toISOString(),
            description: event.description,
            extra: {
                type: inferEventType(event.summary),
                room: event.location,
                teacher: event.organizer,
                links: event.url ? [{ label: "Open event", url: event.url }] : [],
                raw: event,
            },
        })),
    };
}

export function normaliseICalWeek(
    eventsByDay: Record<string, any[]>,
    timezone = "UTC",
): StandardWeek {
    const days: StandardTimetable[] = [];

    for (const date of Object.keys(eventsByDay)) {
        days.push(normaliseICalDay(eventsByDay[date], date, timezone));
    }

    return { days };
}

/* =========================================================
   UNIFIED ENTRY HELPERS
========================================================= */

/**
 * Standardise a single day regardless of provider
 */
export async function standardiseDay({
    provider,
    rawDay,
    parsedICalEvents,
    date,
}: {
    provider: "edumate" | "ical";
    rawDay?: any;
    parsedICalEvents?: any[];
    date?: string;
}): Promise<StandardTimetable> {
    if (provider === "edumate") {
        if (!rawDay) throw new Error("Missing Edumate data");
        return normaliseEdumateDay(rawDay);
    }

    if (provider === "ical") {
        if (!parsedICalEvents) throw new Error("Missing iCal events");
        if (!date) throw new Error("Missing date for iCal events");
        return normaliseICalDay(parsedICalEvents, date);
    }

    throw new Error("Unknown timetable provider");
}

/**
 * Standardise a week regardless of provider
 */
export async function standardiseWeek({
    provider,
    fetchEdumateDay,
    icalEventsByDay,
    startDate,
}: {
    provider: "edumate" | "ical";
    fetchEdumateDay?: (date: string) => Promise<any>;
    icalEventsByDay?: Record<string, any[]>;
    startDate: string;
}): Promise<StandardWeek> {
    if (!isValidISODate(startDate)) {
        throw new Error("Invalid week start date");
    }

    if (provider === "edumate") {
        if (!fetchEdumateDay) throw new Error("Missing edumate fetch function");
        return normaliseEdumateWeek(fetchEdumateDay, startDate);
    }

    if (provider === "ical") {
        if (!icalEventsByDay) throw new Error("Missing iCal week events");
        return normaliseICalWeek(icalEventsByDay);
    }

    throw new Error("Unknown timetable provider");
}

export const timetableNormaliser = {
    normaliseEdumateDay,
    normaliseEdumateWeek,
    normaliseICalDay,
    normaliseICalWeek,
    standardiseDay,
    standardiseWeek,
};
