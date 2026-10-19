import z from "zod";
import { Frequency } from "rrule";

export const ISODateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const RRULE = z.object({
    freq: z.enum(Frequency),
    interval: z.number().int().positive().optional(),
    count: z.number().int().positive().optional(),
    until: z.date().optional(),
    dtstart: z.date().optional(),
    byweekday: z
        .union([z.number(), z.array(z.number()), z.string(), z.array(z.string())])
        .optional(),
    bymonth: z.union([z.number(), z.array(z.number())]).optional(),
    bymonthday: z.union([z.number(), z.array(z.number())]).optional(),
});

export const calendarEvent = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    start: z.iso.datetime({ offset: true }),
    end: z.iso.datetime({ offset: true }),
    allDay: z.boolean().default(false).optional(),
    timezone: z.string().optional(),
    recurrence: RRULE.optional(),
    extra: z.record(z.string(), z.unknown()).optional(),
});

export const calendarDay = z.object({
    date: ISODateString,
    label: z.string().optional(),
    timezone: z.string(),
    events: z.array(calendarEvent),
});

export const sourceCoverage = z.object({
    from: ISODateString.optional(),
    to: ISODateString.optional(),
});

export const sourceUpdateSchedule = z.object({
    intervalMs: z.number().int().positive().optional(),
    nextRunAt: z.number().int().positive().optional(),
});

export const source = z.object({
    id: z.string(),
    name: z.string(),
    data: z.array(calendarEvent),
    source: z.string().optional(),
    live: z.boolean().default(false),
    coverage: sourceCoverage.default({}),
    lastSyncedAt: z.number().int().positive().optional(),
    updateSchedule: sourceUpdateSchedule.optional(),
});

export type Source = z.infer<typeof source>;
export type SourceCoverage = z.infer<typeof sourceCoverage>;

export type SourceActions = {
    sync: (range?: SourceCoverage) => Promise<Source>;
    updateTo: (range: SourceCoverage) => Promise<Source>;
};

export type RuntimeSource = Source & SourceActions;

export const layer = z.object({
    id: z.string(),
    name: z.string(),
    color: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .optional(),
    pull: z.array(source),
    push: z.array(source),
    extra: source.optional().default({
        id: "extra",
        name: "Extra",
        data: [],
        live: false,
        coverage: {},
    }),
    data: z.array(calendarDay).optional(),
});

export const schedule = z.object({
    id: z.string(),
    name: z.string(),
    layers: z.array(layer),
    updated: z.number().optional(),
});
