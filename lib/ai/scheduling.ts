/**
 * lib/ai/scheduling.ts
 *
 * Deterministic study-session placement. The LLM only ranks/estimates tasks;
 * THIS code decides exactly when each task is worked on. It takes ranked tasks
 * plus busy intervals (timetable classes, existing calendar) and slots sessions
 * into free time by priority and urgency, respecting daily caps and due dates.
 *
 * Pure functions only — no IO, no LLM. Easy to reason about and test.
 */

export interface PlannerTask {
    id: string;
    title: string;
    estimatedMinutes: number;
    priority: number; // 1 (low) – 5 (urgent)
    reasoning: string;
    suggestedDueDate?: string | null; // ISO
    matchedAssignmentId?: string | null;
}

export interface BusyInterval {
    start: string; // ISO
    end: string; // ISO
    title?: string;
}

export interface PlacedBlock {
    id: string;
    taskId: string;
    title: string;
    start: string; // ISO
    end: string; // ISO
    priority: number;
    sessionIndex: number; // 1-based
    sessionCount: number;
}

export interface ScheduleOptions {
    startDate: string; // YYYY-MM-DD (the user's local date)
    horizonDays: number;
    weekdayWindow: [number, number]; // [startHour, endHour] e.g. [16, 21]
    weekendWindow: [number, number]; // e.g. [10, 18]
    maxMinutesPerDay: number;
    maxSessionMinutes: number;
    breakMinutes: number;
    /**
     * Minutes from Date.prototype.getTimezoneOffset() on the client (UTC minus
     * local). Used so study windows fall on the right *local* wall-clock hours.
     * Defaults to 0 (UTC).
     */
    tzOffsetMinutes?: number;
    now?: number; // overridable for testing
}

export interface ScheduleResult {
    blocks: PlacedBlock[];
    unplaced: { taskId: string; title: string; remainingMinutes: number }[];
}

export const DEFAULT_SCHEDULE_OPTIONS: Omit<ScheduleOptions, "startDate"> = {
    horizonDays: 10,
    weekdayWindow: [16, 21],
    weekendWindow: [10, 18],
    maxMinutesPerDay: 240,
    maxSessionMinutes: 90,
    breakMinutes: 10,
};

interface Interval {
    start: number; // ms
    end: number; // ms
}

const MIN = 60_000;

function dateKey(ms: number): string {
    return new Date(ms).toISOString().slice(0, 10);
}

function isWeekend(ms: number): boolean {
    const d = new Date(ms).getUTCDay();
    return d === 0 || d === 6;
}

/** Build the day's working window as an ms interval, anchored to local wall-clock hours. */
function dayWindow(dayMs: number, opts: ScheduleOptions): Interval {
    const [sH, eH] = isWeekend(dayMs) ? opts.weekendWindow : opts.weekdayWindow;
    const base = new Date(dayMs);
    const off = (opts.tzOffsetMinutes ?? 0) * MIN;
    // Local hour H on this date == Date.UTC(...,H) + offset. (offset = UTC − local)
    const start = Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), sH, 0, 0) + off;
    const end = Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), eH, 0, 0) + off;
    return { start, end };
}

/** Subtract busy intervals from a single window, returning free sub-intervals. */
function subtractBusy(window: Interval, busy: Interval[]): Interval[] {
    const overlapping = busy
        .filter((b) => b.end > window.start && b.start < window.end)
        .sort((a, b) => a.start - b.start);

    const free: Interval[] = [];
    let cursor = window.start;
    for (const b of overlapping) {
        if (b.start > cursor) free.push({ start: cursor, end: Math.min(b.start, window.end) });
        cursor = Math.max(cursor, b.end);
        if (cursor >= window.end) break;
    }
    if (cursor < window.end) free.push({ start: cursor, end: window.end });
    return free.filter((f) => f.end - f.start >= 15 * MIN);
}

function splitIntoSessions(task: PlannerTask, maxSession: number): number[] {
    const total = Math.max(5, Math.round(task.estimatedMinutes));
    if (total <= maxSession) return [total];
    const count = Math.ceil(total / maxSession);
    const even = Math.ceil(total / count);
    const sessions: number[] = [];
    let remaining = total;
    for (let i = 0; i < count; i++) {
        const len = Math.min(even, remaining);
        sessions.push(len);
        remaining -= len;
    }
    return sessions.filter((s) => s > 0);
}

function sortTasks(tasks: PlannerTask[]): PlannerTask[] {
    return [...tasks].sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        const da = a.suggestedDueDate ? new Date(a.suggestedDueDate).getTime() : Infinity;
        const db = b.suggestedDueDate ? new Date(b.suggestedDueDate).getTime() : Infinity;
        if (da !== db) return da - db;
        return b.estimatedMinutes - a.estimatedMinutes;
    });
}

let blockSeq = 0;
function blockId(): string {
    blockSeq += 1;
    return `blk_${Date.now().toString(36)}_${blockSeq}`;
}

/**
 * Place ranked tasks into free time. Returns scheduled blocks (chronological)
 * and any work that couldn't fit within the horizon / before its due date.
 */
export function buildSchedule(
    tasks: PlannerTask[],
    busyRaw: BusyInterval[],
    opts: ScheduleOptions,
): ScheduleResult {
    const now = opts.now ?? Date.now();
    const busy: Interval[] = busyRaw
        .map((b) => ({ start: new Date(b.start).getTime(), end: new Date(b.end).getTime() }))
        .filter((b) => Number.isFinite(b.start) && Number.isFinite(b.end) && b.end > b.start);

    // Pre-compute free intervals per day, chronological. Clamp first slots to "now".
    const anchor = Date.parse(opts.startDate + "T00:00:00Z");
    const freeByDay: { day: string; slots: Interval[] }[] = [];
    for (let i = 0; i < opts.horizonDays; i++) {
        const dayMs = anchor + i * 24 * 60 * MIN;
        const win = dayWindow(dayMs, opts);
        const clampedWin: Interval = { start: Math.max(win.start, now + 5 * MIN), end: win.end };
        if (clampedWin.end - clampedWin.start < 15 * MIN) continue;
        freeByDay.push({ day: dateKey(dayMs), slots: subtractBusy(clampedWin, busy) });
    }

    const usedPerDay: Record<string, number> = {};
    const blocks: PlacedBlock[] = [];
    const unplaced: ScheduleResult["unplaced"] = [];

    for (const task of sortTasks(tasks)) {
        const sessions = splitIntoSessions(task, opts.maxSessionMinutes);
        const due = task.suggestedDueDate ? new Date(task.suggestedDueDate).getTime() : Infinity;
        let placedCount = 0;

        sessions.forEach((sessionMinutes, idx) => {
            const need = sessionMinutes * MIN;
            for (const day of freeByDay) {
                const used = usedPerDay[day.day] ?? 0;
                if (used + sessionMinutes > opts.maxMinutesPerDay) continue;

                for (let s = 0; s < day.slots.length; s++) {
                    const slot = day.slots[s];
                    const available = slot.end - slot.start;
                    // Respect due date: the session must end on/before it.
                    if (slot.start + need > due && Number.isFinite(due)) continue;
                    if (available < need) continue;

                    const start = slot.start;
                    const end = start + need;
                    blocks.push({
                        id: blockId(),
                        taskId: task.id,
                        title: task.title,
                        start: new Date(start).toISOString(),
                        end: new Date(end).toISOString(),
                        priority: task.priority,
                        sessionIndex: idx + 1,
                        sessionCount: sessions.length,
                    });
                    // Consume the slot (block + break).
                    slot.start = end + opts.breakMinutes * MIN;
                    if (slot.end - slot.start < 15 * MIN) day.slots.splice(s, 1);
                    usedPerDay[day.day] = used + sessionMinutes;
                    placedCount += 1;
                    return; // session placed
                }
            }
            // Could not place this session anywhere.
            unplaced.push({
                taskId: task.id,
                title: task.title,
                remainingMinutes: sessionMinutes,
            });
        });

        void placedCount;
    }

    blocks.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    // Collapse multiple unplaced sessions of the same task into one entry.
    const mergedUnplaced = Object.values(
        unplaced.reduce<Record<string, ScheduleResult["unplaced"][number]>>((acc, u) => {
            if (!acc[u.taskId]) acc[u.taskId] = { ...u };
            else acc[u.taskId].remainingMinutes += u.remainingMinutes;
            return acc;
        }, {}),
    );

    return { blocks, unplaced: mergedUnplaced };
}
