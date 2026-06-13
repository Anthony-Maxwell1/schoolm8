"use client";

/**
 * /scheduler — Smart Scheduler AI
 *
 * The student describes their workload in plain language. Gemini ranks/estimates
 * the tasks (weighted by real Canvas due dates); a deterministic algorithm then
 * places each task into free time around their timetable. The student reviews,
 * trims, and saves the plan.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { format, parseISO } from "date-fns";
import { CalendarClock, Wand2, Trash2, Save, Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import {
    Button,
    Textarea,
    Spinner,
    Badge,
    Card,
    Alert,
    EmptyState,
    Select,
    Checkbox,
} from "@/components/ui/components";
import { ConnectGeminiCTA } from "@/components/ai/ConnectGeminiCTA";
import { useAuth } from "@/context/authContext";
import type { PlacedBlock, PlannerTask } from "@/lib/ai/scheduling";

type Task = PlannerTask;
type Block = PlacedBlock & { reasoning?: string; suggestedDueDate?: string | null };

const PRIORITY_VARIANT: Record<number, "danger" | "warning" | "info" | "default"> = {
    5: "danger",
    4: "warning",
    3: "info",
    2: "default",
    1: "default",
};

const EXAMPLE =
    "Essay for English due Friday, 2 maths worksheets, study for the bio test next week, and finish the history reading.";

export default function SchedulerPage() {
    const { token, loading: authLoading } = useAuth();

    const [boot, setBoot] = useState(true);
    const [needsKey, setNeedsKey] = useState(false);
    const [keyInvalid, setKeyInvalid] = useState(false);

    const [text, setText] = useState("");
    const [hoursPerDay, setHoursPerDay] = useState("4");
    const [planning, setPlanning] = useState(false);

    const [tasks, setTasks] = useState<Task[]>([]);
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [unplaced, setUnplaced] = useState<{ taskId: string; title: string; remainingMinutes: number }[]>([]);
    const [saved, setSaved] = useState<Block[]>([]);
    const [saving, setSaving] = useState(false);

    const [calendarConnected, setCalendarConnected] = useState(false);
    const [addToCalendar, setAddToCalendar] = useState(true);
    const [repeatWeeks, setRepeatWeeks] = useState("0");

    const loadSaved = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch("/api/ai/scheduler/blocks", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) setSaved((await res.json()).blocks ?? []);
        } catch {
            /* non-fatal */
        }
    }, [token]);

    useEffect(() => {
        if (authLoading || !token) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch("/api/ai/key", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (cancelled) return;
                if (!data.hasKey) setNeedsKey(true);
                else if (data.keyStatus === "invalid") setKeyInvalid(true);

                const calRes = await fetch("/api/calendar/status", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (calRes.ok && !cancelled) {
                    setCalendarConnected(!!(await calRes.json()).connected);
                }
            } catch {
                /* ignore */
            } finally {
                await loadSaved();
                if (!cancelled) setBoot(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [authLoading, token, loadSaved]);

    // Pull timetable classes/events for the next two weeks as busy intervals.
    const gatherBusy = useCallback(async () => {
        if (!token) return [] as { start: string; end: string; title?: string }[];
        const busy: { start: string; end: string; title?: string }[] = [];
        const today = new Date();
        for (let w = 0; w < 2; w++) {
            const start = new Date(today);
            start.setDate(start.getDate() + w * 7);
            const startStr = start.toISOString().slice(0, 10);
            try {
                const res = await fetch(`/api/timetable/fetch?week=${startStr}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) continue;
                const data = await res.json();
                const tt = data.timetable;
                if (!tt || typeof tt !== "object") continue;
                const days = Array.isArray(tt) ? tt : Object.values(tt);
                for (const day of days as { events?: { type: string; start: string; end: string; title: string }[] }[]) {
                    for (const e of day.events ?? []) {
                        if (e.type === "class" || e.type === "event") {
                            busy.push({ start: e.start, end: e.end, title: e.title });
                        }
                    }
                }
            } catch {
                /* timetable not connected — schedule into study hours only */
            }
        }

        // Also treat existing Google Calendar events as busy time.
        try {
            const startStr = today.toISOString().slice(0, 10);
            const res = await fetch(`/api/calendar/events?start=${startStr}&days=14`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                for (const b of data.busy ?? []) {
                    busy.push({ start: b.start, end: b.end, title: b.title });
                }
            }
        } catch {
            /* calendar not connected — ignore */
        }

        return busy;
    }, [token]);

    const generate = async () => {
        const trimmed = text.trim();
        if (!trimmed || planning || !token) return;
        setPlanning(true);
        setTasks([]);
        setBlocks([]);
        setUnplaced([]);
        try {
            const busy = await gatherBusy();
            const res = await fetch("/api/ai/scheduler/plan", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: trimmed,
                    busy,
                    maxMinutesPerDay: Math.round(parseFloat(hoursPerDay) * 60) || 240,
                    tzOffsetMinutes: new Date().getTimezoneOffset(),
                }),
            });
            if (res.status === 409) {
                setNeedsKey(true);
                return;
            }
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Could not build a plan");
            const taskById = new Map<string, Task>((data.tasks as Task[]).map((t) => [t.id, t]));
            setTasks(data.tasks ?? []);
            setBlocks(
                (data.blocks as PlacedBlock[]).map((b) => ({
                    ...b,
                    reasoning: taskById.get(b.taskId)?.reasoning,
                    suggestedDueDate: taskById.get(b.taskId)?.suggestedDueDate,
                })),
            );
            setUnplaced(data.unplaced ?? []);
            if ((data.blocks ?? []).length === 0) {
                toast.info("No free time found — try increasing hours/day or freeing up your timetable.");
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not build a plan");
        } finally {
            setPlanning(false);
        }
    };

    const removeBlock = (id: string) => setBlocks((prev) => prev.filter((b) => b.id !== id));

    const pushToGoogleCalendar = async (toPush: Block[]) => {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const weeks = parseInt(repeatWeeks, 10);
        const recurrence = weeks > 0 ? [`RRULE:FREQ=WEEKLY;COUNT=${weeks}`] : undefined;
        const events = toPush.map((b) => ({
            summary: `📚 ${b.title}${b.sessionCount > 1 ? ` (${b.sessionIndex}/${b.sessionCount})` : ""}`,
            description: b.reasoning ? `Planned by SchoolMate — ${b.reasoning}` : "Planned by SchoolMate",
            start: b.start,
            end: b.end,
            timeZone,
            recurrence,
        }));
        const res = await fetch("/api/calendar/events", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ events }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not add to Google Calendar");
        return data.created as number;
    };

    const savePlan = async () => {
        if (blocks.length === 0 || !token) return;
        const toPush = blocks;
        setSaving(true);
        try {
            const res = await fetch("/api/ai/scheduler/blocks", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ blocks: toPush }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Could not save plan");

            let calMsg = "";
            if (calendarConnected && addToCalendar) {
                try {
                    const n = await pushToGoogleCalendar(toPush);
                    calMsg = ` Added ${n} to Google Calendar.`;
                } catch (calErr) {
                    toast.error(calErr instanceof Error ? calErr.message : "Calendar add failed");
                }
            }

            setSaved(data.blocks ?? []);
            setBlocks([]);
            setTasks([]);
            setUnplaced([]);
            toast.success("Study plan saved." + calMsg);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not save plan");
        } finally {
            setSaving(false);
        }
    };

    const clearSaved = async () => {
        if (!token || saved.length === 0) return;
        if (!confirm("Clear your saved study plan?")) return;
        try {
            await fetch("/api/ai/scheduler/blocks", {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            setSaved([]);
            toast.success("Study plan cleared.");
        } catch {
            toast.error("Could not clear plan");
        }
    };

    const groupedProposed = useMemo(() => groupByDay(blocks), [blocks]);
    const groupedSaved = useMemo(() => groupByDay(saved), [saved]);

    if (authLoading || boot) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center text-[var(--color-text-secondary)]">
                <Spinner size="lg" />
            </div>
        );
    }

    if (needsKey || keyInvalid) {
        return (
            <div className="min-h-screen bg-[var(--color-surface)] px-6 py-20">
                <div className="mx-auto max-w-md">
                    <ConnectGeminiCTA feature="the smart scheduler" invalid={keyInvalid} />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-surface)] px-6 py-12">
            <div className="mx-auto max-w-3xl">
                <Text label>Plan</Text>
                <h1 className="font-[family-name:var(--font-display)] text-[42px] leading-[1.1] tracking-[-0.01em] text-[var(--color-text-primary)]">
                    Smart Scheduler
                </h1>
                <p className="mt-3 text-[var(--color-text-secondary)]">
                    Describe what you need to do. The AI prioritises it by your real deadlines and
                    fits it around your timetable.
                </p>

                {/* Input */}
                <Card className="mt-8">
                    <Textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        rows={4}
                        placeholder={`e.g. ${EXAMPLE}`}
                        aria-label="Describe your workload"
                    />
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-[var(--color-text-tertiary)]" />
                            <span className="text-sm text-[var(--color-text-secondary)]">Study time per day</span>
                            <Select
                                value={hoursPerDay}
                                onChange={(e) => setHoursPerDay(e.target.value)}
                                options={["1", "2", "3", "4", "5", "6"].map((h) => ({
                                    value: h,
                                    label: `${h} hour${h === "1" ? "" : "s"}`,
                                }))}
                                className="w-auto"
                            />
                        </div>
                        <Button
                            onClick={generate}
                            loading={planning}
                            leftIcon={!planning ? <Wand2 className="h-4 w-4" /> : undefined}
                        >
                            {planning ? "Planning…" : "Generate plan"}
                        </Button>
                    </div>
                    {!text && (
                        <button
                            onClick={() => setText(EXAMPLE)}
                            className="mt-3 text-left text-xs text-[var(--color-primary)] underline underline-offset-2"
                        >
                            Use an example
                        </button>
                    )}
                </Card>

                {/* Proposed plan */}
                {tasks.length > 0 && (
                    <section className="mt-10">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-text-primary)]">
                                Proposed plan
                            </h2>
                            <Button
                                onClick={savePlan}
                                loading={saving}
                                disabled={blocks.length === 0}
                                leftIcon={!saving ? <Save className="h-4 w-4" /> : undefined}
                            >
                                Accept &amp; save
                            </Button>
                        </div>

                        {/* Google Calendar options */}
                        {blocks.length > 0 && (
                            <div className="mb-6 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-3">
                                {calendarConnected ? (
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                        <Checkbox
                                            label="Add these sessions to Google Calendar"
                                            checked={addToCalendar}
                                            onChange={(e) => setAddToCalendar(e.target.checked)}
                                        />
                                        {addToCalendar && (
                                            <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                                                Repeat
                                                <Select
                                                    value={repeatWeeks}
                                                    onChange={(e) => setRepeatWeeks(e.target.value)}
                                                    options={[
                                                        { value: "0", label: "Just this week" },
                                                        { value: "2", label: "Weekly × 2" },
                                                        { value: "4", label: "Weekly × 4" },
                                                        { value: "8", label: "Weekly × 8" },
                                                    ]}
                                                    className="w-auto"
                                                />
                                            </label>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-[var(--color-text-secondary)]">
                                        Want these on your calendar?{" "}
                                        <Link
                                            href="/settings/integrations"
                                            className="text-[var(--color-primary)] underline underline-offset-2"
                                        >
                                            Connect Google Calendar
                                        </Link>{" "}
                                        to add study sessions automatically.
                                    </p>
                                )}
                            </div>
                        )}

                        {/* AI reasoning */}
                        <div className="mb-6 space-y-2">
                            {tasks
                                .slice()
                                .sort((a, b) => b.priority - a.priority)
                                .map((t) => (
                                    <div
                                        key={t.id}
                                        className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-3"
                                    >
                                        <Badge variant={PRIORITY_VARIANT[t.priority] ?? "default"}>
                                            P{t.priority}
                                        </Badge>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium text-[var(--color-text-primary)]">
                                                {t.title}{" "}
                                                <span className="text-sm font-normal text-[var(--color-text-tertiary)]">
                                                    · {t.estimatedMinutes} min
                                                </span>
                                            </p>
                                            <p className="text-sm text-[var(--color-text-secondary)]">
                                                {t.reasoning}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                        </div>

                        {unplaced.length > 0 && (
                            <Alert
                                variant="warning"
                                title="Some work didn't fit"
                                className="mb-6"
                                description={`Couldn't place: ${unplaced
                                    .map((u) => `${u.title} (${u.remainingMinutes} min)`)
                                    .join(", ")}. Try more hours/day or a longer horizon.`}
                            />
                        )}

                        <CalendarView grouped={groupedProposed} onRemove={removeBlock} editable />
                    </section>
                )}

                {/* Saved plan */}
                {saved.length > 0 && (
                    <section className="mt-12">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-2xl text-[var(--color-text-primary)]">
                                <CheckCircle2 className="h-5 w-5 text-[var(--color-success)]" /> Your study plan
                            </h2>
                            <Button variant="ghost" size="sm" leftIcon={<Trash2 className="h-4 w-4" />} onClick={clearSaved}>
                                Clear
                            </Button>
                        </div>
                        <CalendarView grouped={groupedSaved} />
                    </section>
                )}

                {tasks.length === 0 && saved.length === 0 && (
                    <div className="mt-12">
                        <EmptyState
                            icon={<CalendarClock className="h-6 w-6" />}
                            title="No plan yet"
                            description="Describe your workload above and generate a plan to see it laid out here."
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Small local helpers/components ──────────────────────────────────────────

function Text({ label, children }: { label?: boolean; children: React.ReactNode }) {
    return (
        <span
            className={
                label
                    ? "mb-2 block text-xs font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]"
                    : ""
            }
        >
            {children}
        </span>
    );
}

function groupByDay(blocks: Block[]): { day: string; blocks: Block[] }[] {
    const map = new Map<string, Block[]>();
    for (const b of blocks) {
        const key = b.start.slice(0, 10);
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(b);
    }
    return [...map.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([day, list]) => ({
            day,
            blocks: list.sort((a, b) => a.start.localeCompare(b.start)),
        }));
}

function CalendarView({
    grouped,
    onRemove,
    editable,
}: {
    grouped: { day: string; blocks: Block[] }[];
    onRemove?: (id: string) => void;
    editable?: boolean;
}) {
    if (grouped.length === 0) {
        return (
            <p className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-text-tertiary)]">
                Nothing scheduled.
            </p>
        );
    }
    return (
        <div className="space-y-5">
            {grouped.map(({ day, blocks }) => (
                <div key={day}>
                    <p className="mb-2 text-sm font-semibold text-[var(--color-text-secondary)]">
                        {format(parseISO(day + "T00:00:00"), "EEEE, d MMMM")}
                    </p>
                    <div className="space-y-2">
                        {blocks.map((b) => (
                            <div
                                key={b.id}
                                className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] px-4 py-3"
                            >
                                <div className="w-24 shrink-0 text-sm tabular-nums text-[var(--color-text-secondary)]">
                                    {format(parseISO(b.start), "h:mm a")}
                                    <span className="text-[var(--color-text-tertiary)]"> –</span>
                                    <br />
                                    {format(parseISO(b.end), "h:mm a")}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium text-[var(--color-text-primary)]">
                                        {b.title}
                                    </p>
                                    {b.sessionCount > 1 && (
                                        <p className="text-xs text-[var(--color-text-tertiary)]">
                                            Session {b.sessionIndex} of {b.sessionCount}
                                        </p>
                                    )}
                                </div>
                                <Badge variant={PRIORITY_VARIANT[b.priority] ?? "default"}>P{b.priority}</Badge>
                                {editable && onRemove && (
                                    <button
                                        onClick={() => onRemove(b.id)}
                                        aria-label="Remove session"
                                        className="rounded p-1 text-[var(--color-text-tertiary)] hover:bg-[var(--color-muted)] hover:text-[var(--color-danger)]"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
