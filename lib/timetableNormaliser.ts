// /lib/timetableNormaliser.ts

/* =========================================================
   TYPES
========================================================= */

export type StandardTimetable = {
    source: "edumate" | "ical";
    date: string; // YYYY-MM-DD
    label?: string;
    timezone: string;
    events: StandardEvent[];
};

export type StandardWeek = {
    days: StandardTimetable[];
};

export type StandardEvent = {
    id?: string;
    type: "class" | "event" | "break" | "other";
    title: string;

    start: string; // ISO string
    end: string; // ISO string

    period?: string;
    room?: string;
    teacher?: string;

    description?: string;

    links?: {
        label: string;
        url: string;
    }[];

    raw?: any; // original provider payload
};

/* =========================================================
   HELPERS
========================================================= */

export function isValidISODate(input: string) {
    return /^\d{4}-\d{2}-\d{2}$/.test(input);
}

export function stripHtml(input?: string) {
    return input?.replace(/<[^>]*>/g, "") ?? "";
}

export function toISO(dateStr: string) {
    return new Date(dateStr).toISOString();
}

export function inferEventType(summary?: string): StandardEvent["type"] {
    if (!summary) return "other";

    const s = summary.toLowerCase();

    if (s.includes("period") || s.includes("lesson") || s.includes("class")) return "class";

    if (s.includes("break") || s.includes("recess") || s.includes("lunch")) return "break";

    return "event";
}

export function getWeekDates(startDate: string) {
    const base = new Date(startDate);
    const dates: string[] = [];

    for (let i = 0; i < 7; i++) {
        const d = new Date(base);
        d.setDate(base.getDate() + i);
        dates.push(d.toISOString().split("T")[0]);
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
            type: "class",

            title: event.activityName,

            start: toISO(event.startDateTime.date),
            end: toISO(event.endDateTime.date),

            period: event.period,
            room: event.room?.replace(/[()]/g, "").trim(),
            description: event.displayTime,

            links: (event.links || []).map((l: any) => ({
                label: stripHtml(l.text),
                url: l.href,
            })),

            raw: event,
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
            type: inferEventType(event.summary),

            title: event.summary,

            start: new Date(event.start).toISOString(),
            end: new Date(event.end).toISOString(),

            room: event.location,
            teacher: event.organizer,
            description: event.description,

            links: event.url ? [{ label: "Open event", url: event.url }] : [],

            raw: event,
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
    date: string;
}): Promise<StandardTimetable> {
    if (provider === "edumate") {
        if (!rawDay) throw new Error("Missing Edumate data");
        return normaliseEdumateDay(rawDay);
    }

    if (provider === "ical") {
        if (!parsedICalEvents) throw new Error("Missing iCal events");
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
