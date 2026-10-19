"use client";

import { ScheduleXCalendar, useNextCalendarApp } from "@schedule-x/react";
import {
    CalendarType,
    createViewDay,
    createViewMonthAgenda,
    createViewMonthGrid,
    createViewWeek,
    createViewWeekAgenda,
} from "@schedule-x/calendar";
import { createEventsServicePlugin } from "@schedule-x/events-service";
import "temporal-polyfill/global";
import "@schedule-x/theme-default/dist/index.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/authContext";
import { Button, DropdownMenu, Modal, Text } from "@/components/ui/components";
import { createDragAndDropPlugin } from "@/lib/calendar/drag-and-drop";
import { createResizePlugin } from "@/lib/calendar/resize";
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Cog,
    Lock,
    MousePointer2,
    Pencil,
    Trash2,
} from "lucide-react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import { defaultSettings, TimetableLayerSettings } from "@/lib/schedule/layers";

type Extra = Record<string, unknown>;
type Event = {
    id: string;
    title: string;
    description?: string;
    start: string;
    end: string;
    timezone?: string;
    allDay?: boolean;
    extra?: Extra;
};
type Day = { date: string; timezone: string; events: Event[] };
type Layer = {
    id: string;
    name: string;
    type: "timetable" | "none";
    enabled: boolean;
    color?: string;
    settings?: Partial<TimetableLayerSettings>;
    data?: Day[];
    source?: { name: string; source?: string };
};
type Schedule = { id: string; name: string; layers: Layer[]; data: Day[]; updated?: number };
type CalendarDate = { toPlainDate: () => { toString: () => string } };
type CalendarRange = { start: CalendarDate; end: CalendarDate };
type CustomCalendarEvent = {
    calendarId: string;
    title: string;
    start: { day: number; month: number; year: number };
    end: { day: number; month: number; year: number };
};

const colors = ["#4f46e5", "#16a34a", "#db2777", "#ea580c", "#0891b2", "#7c3aed"];
const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

function toScheduleEvent(event: Event, calendarId: string) {
    const timezone = event.timezone ?? "Australia/Sydney";
    const start = Temporal.Instant.from(event.start).toZonedDateTimeISO(timezone);
    const end = Temporal.Instant.from(event.end).toZonedDateTimeISO(timezone);
    return { id: event.id, title: event.title, start, end, calendarId };
}

function localDateTimeValue(value: string): string {
    const date = new Date(value);
    const pad = (part: number) => String(part).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function isoFromLocalDateTime(value: string): string {
    return new Date(value).toISOString();
}

function eventCount(schedule: Schedule | { data: Day[] }): number {
    return schedule.data.reduce((count, day) => count + day.events.length, 0);
}

function CustomTimeGridEvent({ calendarEvent }: { calendarEvent: CustomCalendarEvent }) {
    const [isHovered, setIsHovered] = useState(false);
    const [coords, setCoords] = useState<{
        top: number;
        left: number;
        height: number;
        width: number;
    } | null>(null);
    const triggerRef = useRef<HTMLDivElement>(null);

    const eventStyles = {
        backgroundColor: `var(--sx-color-layer-${calendarEvent.calendarId}-container)`,
        color: `var(--sx-color-on-layer-${calendarEvent.calendarId}-container)`,
        borderColor: `var(--sx-color-layer-${calendarEvent.calendarId})`,
    };

    const formattedDate = `${calendarEvent.start.day}/${calendarEvent.start.month}/${calendarEvent.start.year} - ${calendarEvent.end.day}/${calendarEvent.end.month}/${calendarEvent.end.year}`;

    const [isMouseDown, setIsMouseDown] = useState(false);
    const previewWidth = 320;

    useEffect(() => {
        const handleMouseDown = () => {
            setIsMouseDown(true);
            setIsHovered(false);
        };
        const handleMouseUp = () => setIsMouseDown(false);

        window.addEventListener("mousedown", handleMouseDown, { capture: true });
        window.addEventListener("mouseup", handleMouseUp, { capture: true });

        return () => {
            window.removeEventListener("mousedown", handleMouseDown, { capture: true });
            window.removeEventListener("mouseup", handleMouseUp, { capture: true });
        };
    }, []);

    // 1. Accept the native React MouseEvent here
    const handleMouseEnter = (e: React.MouseEvent) => {
        // 2. e.buttons === 1 means the primary (left) mouse button is physically held down right now
        if (isMouseDown || e.buttons === 1) {
            setIsHovered(false);
            return;
        }

        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.top,
                left: rect.left,
                height: rect.height,
                width: rect.width,
            });
        }
        setIsHovered(true);
    };

    return (
        <div
            ref={triggerRef}
            className={`schedule-event group relative h-full w-full cursor-grab select-none bg-white opacity-100 transition-[filter,transform] duration-150 ease-out ${isMouseDown ? "cursor-grabbing" : "hover:brightness-[1.02]"}`}
            onMouseEnter={handleMouseEnter} // Pass the mouse event up
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                style={eventStyles}
                className="schedule-event-card flex h-full flex-col gap-1 overflow-visible rounded-r border-l-3 p-2 shadow-sm transition-[box-shadow,transform] duration-150 ease-out group-hover:-translate-y-px group-hover:shadow-md"
            >
                <div className="text-sm font-medium leading-tight">{calendarEvent.title}</div>
                <div className="text-xs">{formattedDate}</div>
            </div>

            {!isMouseDown &&
                isHovered &&
                coords &&
                createPortal(
                    <div
                        className="schedule-event-preview min-h-50 min-w-80 overflow-clip rounded-lg bg-white opacity-100 shadow-xl ring-1 ring-slate-200/80 pointer-events-none"
                        style={{
                            position: "fixed",
                            top: `${Math.max(8, Math.min(coords.top, window.innerHeight - 208))}px`,
                            left: `${coords.left + coords.width + previewWidth + 16 <= window.innerWidth ? coords.left + coords.width + 8 : Math.max(8, coords.left - previewWidth - 8)}px`,
                            zIndex: 99999,
                        }}
                    >
                        <div
                            style={{
                                ...eventStyles,
                                height: `${coords.height}px`,
                                width: `${coords.width}px`,
                            }}
                            className="min-h-50 min-w-80 flex flex-col gap-1 rounded-r border-l-3 p-3 shadow-2xl transition-transform duration-150 ease-out pointer-events-none"
                        >
                            <div className="wrap-break-word text-sm font-semibold leading-tight whitespace-normal">
                                {calendarEvent.title}
                            </div>
                            <div className="text-xs">{formattedDate}</div>
                            <div
                                className="mt-auto flex items-center justify-end gap-1 border-t pt-1.5"
                                style={{
                                    borderColor: eventStyles.borderColor,
                                    color: eventStyles.color,
                                }}
                            >
                                <MousePointer2
                                    className="h-3.5 w-3.5 opacity-70"
                                    style={{
                                        color: eventStyles.borderColor,
                                    }}
                                />
                                <span className="text-[11px] opacity-80">Click to edit</span>
                            </div>
                            {/* <div className="absolute inset-x-3 top-1 flex justify-between opacity-70">
                                <span className="h-1 w-8 rounded-full bg-slate-400/50" />
                                <span className="h-1 w-8 rounded-full bg-slate-400/50" />
                            </div> */}
                        </div>
                    </div>,
                    document.body,
                )}
        </div>
    );
}

function CalendarView({
    schedule,
    onEventClick,
    overrides,
    onRangeUpdate,
}: {
    schedule: Schedule;
    onEventClick: (eventId: string) => void;
    overrides: Record<string, Event>;
    onRangeUpdate: (range: CalendarRange) => void;
}) {
    const eventsService = useState(() => createEventsServicePlugin())[0];
    const calendars = useMemo(() => {
        const result: Record<string, object> = {};
        schedule.layers.forEach((layer, index) => {
            const color = layer.color ?? colors[index % colors.length];
            result[layer.id] = {
                label: layer.name,
                colorName: `layer-${layer.id}`,
                lightColors: { main: color, container: `${color}33`, onContainer: "#172033" },
            };
        });
        return result;
    }, [schedule]);
    const events = useMemo(
        () =>
            schedule.layers
                .filter((layer) => layer.enabled)
                .flatMap((layer) =>
                    (layer.data ?? []).flatMap((day) =>
                        day.events.map((event) =>
                            toScheduleEvent(overrides[event.id] ?? event, layer.id),
                        ),
                    ),
                ),
        [schedule, overrides],
    );
    const calendar = useNextCalendarApp({
        timezone: "Australia/Sydney",
        views: [
            createViewDay(),
            createViewWeekAgenda(),
            createViewWeek(),
            createViewMonthGrid(),
            createViewMonthAgenda(),
        ],
        calendars: calendars as Record<string, CalendarType>,
        events,
        // weekOptions: {
        //     eventOverlap: false,
        // },
        plugins: [
            eventsService,
            createDragAndDropPlugin(15),
            createResizePlugin(15),
            // createEventModalPlugin(),
        ],
        callbacks: {
            onEventClick: (event) => onEventClick(String(event.id)),
            onRangeUpdate,
        },
    });
    return (
        <ScheduleXCalendar
            calendarApp={calendar}
            customComponents={{
                timeGridEvent: CustomTimeGridEvent,
            }}
        />
    );
}

export default function CalendarApp() {
    const { token, loading: authLoading } = useAuth();
    const [schedules, setSchedules] = useState<
        { id: string; name: string; layerCount?: number; eventCount?: number }[]
    >([]);
    const [schedule, setSchedule] = useState<Schedule | null>(null);
    const [scheduleId, setScheduleId] = useState("");
    const [selectedLayerId, setSelectedLayerId] = useState("");
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [showLayerForm, setShowLayerForm] = useState(false);
    const [showEventForm, setShowEventForm] = useState(false);
    const [showScheduleConfig, setShowScheduleConfig] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [error, setError] = useState("");
    const [overrides, setOverrides] = useState<Record<string, Event>>({});
    const requestedRanges = useRef(new Set<string>());
    const rangeTimers = useRef(new Map<string, number>());

    const request = useCallback(
        async (url: string, options?: RequestInit) => {
            if (!token) throw new Error("You must be signed in");
            const response = await fetch(url, {
                ...options,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    ...(options?.headers ?? {}),
                },
            });
            const body = await response.json();
            if (!response.ok) throw new Error(body.error ?? "Request failed");
            return body;
        },
        [token],
    );

    const loadSchedules = useCallback(async () => {
        const body = await request("/api/schedule/list");
        setSchedules(body.schedules);
        if (!scheduleId && body.schedules[0]) setScheduleId(body.schedules[0].id);
    }, [request, scheduleId]);

    const loadSchedule = useCallback(async () => {
        if (!scheduleId) return;
        const body = await request(`/api/schedule/layers?scheduleId=${scheduleId}`);
        setSchedule(body.schedule);
        setSelectedLayerId((current) => current || body.schedule.layers[0]?.id || "");
    }, [request, scheduleId]);

    const ensureCalendarRange = useCallback(
        async (range: CalendarRange) => {
            if (!scheduleId) return;
            const from = range.start.toPlainDate().toString();
            const visibleTo = range.end.toPlainDate().toString();
            const toDate = new Date(`${visibleTo}T00:00:00Z`);
            toDate.setUTCDate(toDate.getUTCDate() + 7);
            const to = toDate.toISOString().slice(0, 10);
            const key = `${scheduleId}:${from}:${to}`;
            if (requestedRanges.current.has(key)) return;
            requestedRanges.current.add(key);

            const existingTimer = rangeTimers.current.get(key);
            if (existingTimer) window.clearTimeout(existingTimer);
            const timer = window.setTimeout(async () => {
                const toastId = toast.loading("Loading timetable data…");
                try {
                    await request(
                        `/api/schedule/events?scheduleId=${encodeURIComponent(scheduleId)}&from=${from}&to=${to}`,
                    );
                    await loadSchedule();
                    toast.update(toastId, {
                        render: "Timetable updated",
                        type: "success",
                        isLoading: false,
                        autoClose: 1800,
                    });
                } catch (e) {
                    requestedRanges.current.delete(key);
                    toast.update(toastId, {
                        render: e instanceof Error ? e.message : "Could not load timetable",
                        type: "error",
                        isLoading: false,
                        autoClose: 4000,
                    });
                } finally {
                    rangeTimers.current.delete(key);
                }
            }, 250);
            rangeTimers.current.set(key, timer);
        },
        [loadSchedule, request, scheduleId],
    );

    useEffect(() => {
        if (!scheduleId) return;
        const timer = window.setTimeout(() => {
            try {
                const stored = window.localStorage.getItem(
                    `schoolm8:schedule-overrides:${scheduleId}`,
                );
                setOverrides(stored ? (JSON.parse(stored) as Record<string, Event>) : {});
            } catch {
                setOverrides({});
            }
        }, 0);
        return () => window.clearTimeout(timer);
    }, [scheduleId]);

    useEffect(() => {
        if (authLoading || !token) return;
        const timer = window.setTimeout(() => {
            loadSchedules().catch((e) => setError(e.message));
        }, 0);
        return () => window.clearTimeout(timer);
    }, [authLoading, token, loadSchedules]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            loadSchedule().catch((e) => setError(e.message));
        }, 0);
        return () => window.clearTimeout(timer);
    }, [loadSchedule]);

    const refresh = async () => {
        await loadSchedules();
        await loadSchedule();
    };

    const createSchedule = async (requestedName = "My Schedule") => {
        const name = requestedName.trim();
        if (!name) return;
        try {
            const body = await request("/api/schedule/layers", {
                method: "POST",
                body: JSON.stringify({
                    name,
                    layer: {
                        name: "Timetable",
                        type: "timetable",
                        enabled: true,
                    },
                }),
            });
            setScheduleId(body.schedule.id);
            await refresh();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Could not create schedule");
        }
    };

    const saveLayer = async (layer: Partial<Layer>) => {
        try {
            await request("/api/schedule/layers", {
                method: "POST",
                body: JSON.stringify({ scheduleId, layer }),
            });
            setShowLayerForm(false);
            await loadSchedule();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Could not save layer");
        }
    };

    const saveEvent = async (event: Event) => {
        try {
            const sourceLayer = schedule?.layers.find((layer) =>
                (layer.data ?? []).some((day) => day.events.some((item) => item.id === event.id)),
            );
            if (sourceLayer?.type === "timetable") {
                const next = { ...overrides, [event.id]: event };
                window.localStorage.setItem(
                    `schoolm8:schedule-overrides:${scheduleId}`,
                    JSON.stringify(next),
                );
                setOverrides(next);
                setShowEventForm(false);
                setSelectedEvent(null);
                return;
            }
            await request(`/api/schedule/event`, {
                method: event.id ? "PATCH" : "POST",
                body: JSON.stringify({ scheduleId, layerId: selectedLayerId, event }),
            });
            setShowEventForm(false);
            setSelectedEvent(null);
            await loadSchedule();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Could not save event");
        }
    };

    const deleteEvent = async () => {
        if (!selectedEvent || !window.confirm("Delete this event?")) return;
        try {
            await request(
                `/api/schedule/event?scheduleId=${scheduleId}&layerId=${selectedLayerId}&eventId=${selectedEvent.id}`,
                { method: "DELETE" },
            );
            setSelectedEvent(null);
            await loadSchedule();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Could not delete event");
        }
    };

    if (authLoading) return <div className="p-8">Loading schedule…</div>;

    const findEvent = (eventId: string) => {
        for (const layer of schedule?.layers ?? []) {
            for (const day of layer.data ?? []) {
                const event = day.events.find((item) => item.id === eventId);
                if (event) return { event: overrides[event.id] ?? event, layer };
            }
        }
        return null;
    };

    return (
        <div className="schedule-shell relative flex h-screen min-h-[700px] flex-row-reverse bg-slate-50 text-slate-900">
            <aside
                className={`schedule-sidebar flex shrink-0 flex-col border-l border-slate-200 bg-white transition-[width] ${
                    sidebarOpen ? "w-80" : "w-12"
                }`}
            >
                <button
                    className="schedule-sidebar-toggle flex h-10 items-center justify-center border-b border-slate-200 text-slate-500 hover:bg-slate-50"
                    onClick={() => setSidebarOpen((open) => !open)}
                    aria-label={
                        sidebarOpen ? "Collapse schedule sidebar" : "Expand schedule sidebar"
                    }
                >
                    {sidebarOpen ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <ChevronLeft className="h-4 w-4" />
                    )}
                </button>
                {!sidebarOpen ? null : (
                    <>
                        <div className="border-b border-slate-200 p-5">
                            <div className="flex items-center justify-between">
                                <Text variant="h3">Schedule</Text>
                            </div>
                            {/* <select
                        className={`${inputClass} mt-4`}
                        value={scheduleId}
                        onChange={(e) => setScheduleId(e.target.value)}
                    >
                        <option value="">Select schedule</option>
                        {schedules.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.name}
                            </option>
                        ))}
                    </select>
                     */}
                            <div className="flex flex-row mt-4 gap-2">
                                <DropdownMenu
                                    trigger={
                                        <Button variant="outline" size="w-full">
                                            {schedule?.name ?? "Select schedule"}
                                            <ChevronDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    }
                                    items={schedules.map((item) => ({
                                        label: item.name,
                                        onClick: () => setScheduleId(item.id),
                                    }))}
                                />
                                <Button
                                    variant="primary"
                                    iconOnly
                                    leftIcon={<Cog />}
                                    className="px-5"
                                    onClick={() => setShowScheduleConfig(true)}
                                ></Button>
                            </div>

                            {schedule && (
                                <Button
                                    className="mt-3"
                                    variant="secondary"
                                    size="w-full"
                                    onClick={async () => {
                                        const toastId = toast.loading("Refreshing timetable data…");
                                        try {
                                            await request(`/api/schedule/sync`, {
                                                method: "POST",
                                                body: JSON.stringify({ scheduleId }),
                                            });
                                            await loadSchedule();
                                            toast.update(toastId, {
                                                render: "Timetable refreshed",
                                                type: "success",
                                                isLoading: false,
                                                autoClose: 1800,
                                            });
                                        } catch (e) {
                                            toast.update(toastId, {
                                                render:
                                                    e instanceof Error
                                                        ? e.message
                                                        : "Could not refresh timetable",
                                                type: "error",
                                                isLoading: false,
                                                autoClose: 4000,
                                            });
                                        }
                                    }}
                                >
                                    Sync non-live layers
                                </Button>
                            )}
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="mb-3 flex items-center justify-between">
                                <Text variant="h4">Layers</Text>
                                <Button
                                    variant="secondary"
                                    onClick={() => setShowLayerForm(true)}
                                    size="sm"
                                >
                                    Add
                                </Button>
                            </div>
                            {schedule?.layers.map((layer, index) => (
                                <div
                                    key={layer.id}
                                    className="schedule-layer-card mb-2 rounded-lg border border-slate-200 p-3"
                                >
                                    <label className="flex items-center gap-2 text-sm font-medium">
                                        <input
                                            type="checkbox"
                                            checked={layer.enabled}
                                            onChange={() =>
                                                request("/api/schedule/layers", {
                                                    method: "PATCH",
                                                    body: JSON.stringify({
                                                        scheduleId,
                                                        layerId: layer.id,
                                                        layer: { enabled: !layer.enabled },
                                                    }),
                                                })
                                                    .then(loadSchedule)
                                                    .catch((e) => setError(e.message))
                                            }
                                        />
                                        <span
                                            className="h-3 w-3 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    layer.color ?? colors[index % colors.length],
                                            }}
                                        />
                                        {layer.name}
                                    </label>
                                    <p className="mt-1 pl-6 text-xs text-slate-500">
                                        {layer.type === "timetable"
                                            ? "Timetable source"
                                            : "Manual events"}
                                    </p>
                                    <div className="mt-2 flex gap-2 pl-6">
                                        <button
                                            className="text-xs text-indigo-600"
                                            onClick={() => {
                                                setSelectedLayerId(layer.id);
                                                setShowEventForm(true);
                                                setSelectedEvent(null);
                                            }}
                                        >
                                            Add event
                                        </button>
                                        <button
                                            className="text-xs text-slate-500"
                                            onClick={() => {
                                                setSelectedLayerId(layer.id);
                                                setShowLayerForm(true);
                                            }}
                                        >
                                            Edit
                                        </button>
                                    </div>
                                    <p className="mt-3 pl-6 text-xs text-slate-500">
                                        {eventCount({ data: layer.data ?? [] })} events
                                    </p>
                                </div>
                            ))}
                        </div>
                        {error && (
                            <div className="border-t border-red-200 bg-red-50 p-3 text-xs text-red-700">
                                {error}
                            </div>
                        )}
                    </>
                )}
            </aside>
            <main className="schedule-main min-w-0 flex-1">
                <div className="h-full overflow-hidden bg-white [&_.sx-react-calendar-wrapper]:h-full">
                    {schedule ? (
                        <CalendarView
                            key={`${schedule.id}-${schedule.updated ?? 0}`}
                            schedule={schedule}
                            overrides={overrides}
                            onEventClick={(eventId) => {
                                const match = findEvent(eventId);
                                if (!match) return;
                                setSelectedLayerId(match.layer.id);
                                setSelectedEvent(match.event);
                                setShowEventForm(true);
                            }}
                            onRangeUpdate={ensureCalendarRange}
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center text-slate-500">
                            Create or select a schedule to begin.
                        </div>
                    )}
                </div>
            </main>
            <style jsx global>{`
                @keyframes schedule-event-in {
                    from {
                        opacity: 0;
                        transform: translateY(3px) scale(0.985);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                @keyframes schedule-preview-in {
                    from {
                        opacity: 0;
                        transform: translateY(4px) scale(0.98);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                .schedule-event-card {
                    animation: schedule-event-in 220ms var(--ease-default) both;
                    will-change: transform, box-shadow;
                }

                .schedule-event-preview {
                    animation: schedule-preview-in 150ms var(--ease-default) both;
                    transform-origin: top left;
                }

                .schedule-sidebar-toggle,
                .schedule-layer-card,
                .schedule-main {
                    transition-timing-function: var(--ease-default);
                }

                .schedule-sidebar-toggle {
                    transition:
                        background-color var(--duration-base) var(--ease-default),
                        color var(--duration-base) var(--ease-default);
                }

                .schedule-layer-card {
                    background: linear-gradient(135deg, #ffffff 0%, #fffdfa 100%);
                    box-shadow: var(--shadow-sm);
                    transition:
                        border-color var(--duration-base) var(--ease-default),
                        box-shadow var(--duration-base) var(--ease-default),
                        transform var(--duration-base) var(--ease-default);
                }

                .schedule-layer-card:hover {
                    border-color: var(--color-apache-300);
                    box-shadow: var(--shadow-md);
                    transform: translateY(-1px);
                }

                .schedule-main {
                    animation: schedule-main-in 360ms var(--ease-default) both;
                }

                @keyframes schedule-main-in {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                .sx__calendar {
                    border-radius: 0 !important;
                    border: 0 !important;
                }
                :root {
                    --sx-z-index-week-header: 10 !important;
                }
                .sx__time-grid-event-resize-handle {
                    z-index: 1 !important;
                }

                @media (prefers-reduced-motion: reduce) {
                    .schedule-event-card,
                    .schedule-event-preview,
                    .schedule-main {
                        animation: none;
                    }
                }
            `}</style>
            {showLayerForm && (
                <LayerForm
                    layer={schedule?.layers.find((item) => item.id === selectedLayerId)}
                    onClose={() => setShowLayerForm(false)}
                    onSave={saveLayer}
                />
            )}
            {showEventForm && (
                <EventForm
                    event={selectedEvent}
                    onClose={() => {
                        setShowEventForm(false);
                        setSelectedEvent(null);
                    }}
                    onSave={saveEvent}
                    onDelete={selectedEvent ? deleteEvent : undefined}
                    locked={
                        schedule?.layers.find((layer) => layer.id === selectedLayerId)?.type ===
                            "timetable" || selectedEvent?.extra?.sourceType === "timetable"
                    }
                />
            )}
            <ScheduleConfigModal
                open={showScheduleConfig}
                schedules={schedules}
                currentSchedule={schedule}
                onClose={() => setShowScheduleConfig(false)}
                onCreate={createSchedule}
                onRename={async (id, name) => {
                    await request("/api/schedule/layers", {
                        method: "PATCH",
                        body: JSON.stringify({ scheduleId: id, schedule: { name } }),
                    });
                    await refresh();
                }}
                onDelete={async (id) => {
                    if (!window.confirm("Delete this schedule and all of its layers?")) return;
                    await request(`/api/schedule/layers?scheduleId=${id}`, { method: "DELETE" });
                    if (scheduleId === id) setScheduleId("");
                    await refresh();
                }}
            />
        </div>
    );
}

function LayerForm({
    layer,
    onClose,
    onSave,
}: {
    layer?: Layer;
    onClose: () => void;
    onSave: (layer: Partial<Layer>) => void;
}) {
    const [name, setName] = useState(layer?.name ?? "New layer");
    const [type, setType] = useState<Layer["type"]>(layer?.type ?? "none");
    const [color, setColor] = useState(layer?.color ?? colors[0]);
    const [settings, setSettings] = useState<TimetableLayerSettings>({
        ...defaultSettings,
        ...layer?.settings,
    });
    const timetableOptions: {
        key: keyof TimetableLayerSettings;
        label: string;
        description: string;
    }[] = [
        {
            key: "combineDoublePeriods",
            label: "Combine double periods",
            description: "Merge adjacent matching periods.",
        },
        {
            key: "locateRepeatingClasses",
            label: "Detect repeating classes",
            description: "Find established timetable patterns.",
        },
        {
            key: "predictMissingClasses",
            label: "Predict missing classes",
            description: "Show pattern-based events while data is unavailable.",
        },
        {
            key: "markPredictedClasses",
            label: "Mark predictions",
            description: "Label generated events as Predicted.",
        },
        {
            key: "detectFortnightlyPatterns",
            label: "Detect fortnightly patterns",
            description: "Prefer two-week patterns when supported by the data.",
        },
        {
            key: "avoidWeekendPredictions",
            label: "Avoid weekend predictions",
            description: "Do not predict classes on Saturday or Sunday.",
        },
    ];
    return (
        <Modal open title={layer ? "Edit layer" : "Add layer"} onClose={onClose}>
            <input
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Layer name"
            />
            <select
                className={`${inputClass} mt-3`}
                value={type}
                onChange={(e) => setType(e.target.value as Layer["type"])}
            >
                <option value="none">No source (manual events)</option>
                <option value="timetable">Timetable source</option>
            </select>
            <label className="mt-3 flex items-center justify-between text-sm text-slate-700">
                Layer colour
                <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-9 w-14 cursor-pointer rounded border border-slate-300"
                />
            </label>
            {type === "timetable" && (
                <div className="mt-4 rounded-lg border border-slate-200 p-3">
                    <p className="text-sm font-medium text-slate-800">Timetable behaviour</p>
                    <p className="mt-1 text-xs text-slate-500">
                        Balanced defaults are recommended. Predictions never replace actual events.
                    </p>
                    <div className="mt-3 space-y-3">
                        {timetableOptions.map(({ key, label, description }) => (
                            <label
                                key={key}
                                className="flex items-start gap-2 text-sm text-slate-700"
                            >
                                <input
                                    type="checkbox"
                                    checked={settings[key]}
                                    onChange={(event) =>
                                        setSettings((current) => ({
                                            ...current,
                                            [key]: event.target.checked,
                                        }))
                                    }
                                    className="mt-0.5 h-4 w-4 accent-indigo-600"
                                />
                                <span>
                                    <span className="block">{label}</span>
                                    <span className="block text-xs text-slate-500">
                                        {description}
                                    </span>
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
            <button
                className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
                onClick={() =>
                    onSave({
                        id: layer?.id,
                        name,
                        type,
                        color,
                        enabled: layer?.enabled ?? true,
                        settings: type === "timetable" ? settings : undefined,
                    })
                }
            >
                Save layer
            </button>
        </Modal>
    );
}

function EventForm({
    event,
    onClose,
    onSave,
    onDelete,
    locked = false,
}: {
    event: Event | null;
    onClose: () => void;
    onSave: (event: Event) => void;
    onDelete?: () => void;
    locked?: boolean;
}) {
    const [form, setForm] = useState<Event>(() => {
        if (event) return event;
        const now = new Date();
        return {
            id: "",
            title: "",
            start: now.toISOString(),
            end: new Date(now.getTime() + 3600000).toISOString(),
            extra: {},
        };
    });
    const [extra, setExtra] = useState(
        Object.entries(form.extra ?? {}).map(([key, value]) => ({
            key,
            value: String(value ?? ""),
            type: typeof value === "number" ? "int" : "string",
        })),
    );
    const update = (key: keyof Event, value: string) =>
        setForm((current) => ({ ...current, [key]: value }));
    const save = () =>
        onSave({
            ...form,
            extra: Object.fromEntries(
                extra
                    .filter((item) => item.key.trim())
                    .map((item) => [
                        item.key.trim(),
                        item.type === "int" ? Number(item.value) : item.value,
                    ]),
            ),
        });
    return (
        <Modal
            open
            title={event ? (locked ? "Add override" : "Edit event") : "Add event"}
            description={
                locked ? "This source event is locked. Saving creates a local override." : undefined
            }
            onClose={onClose}
        >
            <input
                className={inputClass}
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="Title"
            />
            <textarea
                className={`${inputClass} mt-3`}
                value={form.description ?? ""}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Description"
            />
            {locked && (
                <div className="mt-3 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    <Lock className="h-3.5 w-3.5" />
                    Source event locked; saving creates a local override.
                </div>
            )}
            <div className="mt-3 grid grid-cols-2 gap-2">
                <input
                    className={inputClass}
                    type="datetime-local"
                    value={localDateTimeValue(form.start)}
                    onChange={(e) => update("start", isoFromLocalDateTime(e.target.value))}
                />
                <input
                    className={inputClass}
                    type="datetime-local"
                    value={localDateTimeValue(form.end)}
                    onChange={(e) => update("end", isoFromLocalDateTime(e.target.value))}
                />
            </div>
            <input
                className={`${inputClass} mt-3`}
                value={String(form.extra?.room ?? "")}
                onChange={(e) =>
                    setForm((current) => ({
                        ...current,
                        extra: { ...current.extra, room: e.target.value },
                    }))
                }
                placeholder="Room (e.g. S125)"
            />
            <div className="mt-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Additional data</h3>
                <button
                    className="text-xs text-indigo-600"
                    onClick={() =>
                        setExtra((items) => [...items, { key: "", value: "", type: "string" }])
                    }
                >
                    Add field
                </button>
            </div>
            {extra.map((item, index) => (
                <div key={index} className="mt-2 grid grid-cols-[1fr_90px_1fr] gap-2">
                    <input
                        className={inputClass}
                        placeholder="Name"
                        value={item.key}
                        onChange={(e) =>
                            setExtra((items) =>
                                items.map((x, i) =>
                                    i === index ? { ...x, key: e.target.value } : x,
                                ),
                            )
                        }
                    />
                    <select
                        className={inputClass}
                        value={item.type}
                        onChange={(e) =>
                            setExtra((items) =>
                                items.map((x, i) =>
                                    i === index ? { ...x, type: e.target.value } : x,
                                ),
                            )
                        }
                    >
                        <option value="string">Text</option>
                        <option value="int">Number</option>
                        <option value="project">Project</option>
                        <option value="class">Class</option>
                    </select>
                    <input
                        className={inputClass}
                        placeholder="Value or ID"
                        value={item.value}
                        onChange={(e) =>
                            setExtra((items) =>
                                items.map((x, i) =>
                                    i === index ? { ...x, value: e.target.value } : x,
                                ),
                            )
                        }
                    />
                </div>
            ))}
            <div className="mt-5 flex gap-2">
                <button
                    className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
                    onClick={save}
                >
                    Save event
                </button>
                {onDelete && !locked && (
                    <button
                        className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600"
                        onClick={onDelete}
                    >
                        Delete
                    </button>
                )}
            </div>
        </Modal>
    );
}

function ScheduleConfigModal({
    open,
    schedules,
    currentSchedule,
    onClose,
    onCreate,
    onRename,
    onDelete,
}: {
    open: boolean;
    schedules: { id: string; name: string; layerCount?: number; eventCount?: number }[];
    currentSchedule: Schedule | null;
    onClose: () => void;
    onCreate: (name: string) => void;
    onRename: (id: string, name: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}) {
    const [names, setNames] = useState<Record<string, string>>({});
    const [createOpen, setCreateOpen] = useState(false);
    const [newName, setNewName] = useState("");
    return (
        <>
            <Modal open={open} title="Manage schedules" onClose={onClose} size="lg">
                <div className="space-y-3">
                    {schedules.map((item) => (
                        <div
                            key={item.id}
                            className={`rounded-lg border p-3 ${
                                item.id === currentSchedule?.id
                                    ? "border-indigo-500 bg-indigo-50"
                                    : "border-slate-200"
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <input
                                    className={inputClass}
                                    value={names[item.id] ?? item.name}
                                    onChange={(e) =>
                                        setNames((current) => ({
                                            ...current,
                                            [item.id]: e.target.value,
                                        }))
                                    }
                                />
                                <Button
                                    variant="secondary"
                                    iconOnly
                                    aria-label={`Save ${item.name} name`}
                                    onClick={() =>
                                        void onRename(item.id, names[item.id] ?? item.name)
                                    }
                                    size="md"
                                    leftIcon={
                                        <Pencil className="h-4 w-4 text-[var(--color-on-secondary)] mx-3" />
                                    }
                                ></Button>
                                <Button
                                    variant="danger"
                                    iconOnly
                                    aria-label={`Delete ${item.name}`}
                                    onClick={() => void onDelete(item.id)}
                                    leftIcon={<Trash2 className="h-4 w-4 mx-3" />}
                                ></Button>
                            </div>
                            <p className="mt-2 text-xs text-slate-500">
                                {item.eventCount ?? 0} events · {item.layerCount ?? 0} layers
                            </p>
                        </div>
                    ))}
                    <Button variant="primary" size="w-full" onClick={() => setCreateOpen(true)}>
                        Create schedule
                    </Button>
                </div>
            </Modal>
            <Modal open={createOpen} title="Create schedule" onClose={() => setCreateOpen(false)}>
                <input
                    className={inputClass}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Schedule name"
                    autoFocus
                />
                <Button
                    className="mt-4"
                    variant="primary"
                    size="w-full"
                    disabled={!newName.trim()}
                    onClick={() => {
                        onCreate(newName);
                        setNewName("");
                        setCreateOpen(false);
                    }}
                >
                    Create
                </Button>
            </Modal>
        </>
    );
}
