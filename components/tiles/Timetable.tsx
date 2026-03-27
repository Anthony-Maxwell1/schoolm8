import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/authContext";

type TimetableEvent = {
    id?: string;
    title: string;
    room?: string;
    start: string;
};

type TimetableDay = {
    date: string;
    events: TimetableEvent[];
};

type TimetableResponse = {
    timetable: TimetableDay | TimetableDay[];
};

const timetableCache = new Map<string, TimetableDay>();
async function fetchDayCached(day: string, token: string): Promise<TimetableDay | null> {
    if (timetableCache.has(day)) {
        return timetableCache.get(day)!;
    }

    const res = await fetch(`/api/timetable/fetch?day=${day}`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return null;

    const json: TimetableResponse = await res.json();
    const days = Array.isArray(json.timetable) ? json.timetable : [json.timetable];

    if (!days.length) return null;

    timetableCache.set(days[0].date, days[0]);

    return days[0];
}

export function TimetableList() {
    const [timetable, setTimetable] = useState<TimetableDay[]>([]);
    const { token, loading } = useAuth();

    useEffect(() => {
        if (loading || !token) return;

        let cancelled = false;

        async function fetchTimetable() {
            try {
                const today = new Date().toISOString().split("T")[0];
                const day = await fetchDayCached(today, token!);

                if (!cancelled) {
                    setTimetable(day ? [day] : []);
                }
            } catch {
                if (!cancelled) setTimetable([]);
            }
        }

        fetchTimetable();

        return () => {
            cancelled = true;
        };
    }, [loading, token]);

    return (
        <div className="overflow-y-auto">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Timetable</h2>

            {timetable.length === 0 ? (
                <p className="text-sm text-gray-500">No classes scheduled.</p>
            ) : (
                <div className="space-y-5">
                    {timetable.map((day) => (
                        <div key={day.date} className="space-y-2">
                            <h3 className="text-sm font-medium uppercase tracking-wide text-gray-500">
                                {new Date(day.date).toLocaleDateString(undefined, {
                                    weekday: "long",
                                    month: "short",
                                    day: "numeric",
                                })}
                            </h3>

                            <div className="space-y-2">
                                {day.events.map((event, idx) => (
                                    <div
                                        key={event.id ?? `${event.title}-${event.start}-${idx}`}
                                        className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 p-3"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate font-medium text-blue-900">
                                                {event.title}
                                            </p>
                                            <p className="text-sm text-blue-700">
                                                {event.room ?? "Room TBC"}
                                            </p>
                                        </div>
                                        <span className="ml-3 shrink-0 rounded-md bg-white px-2 py-1 text-xs font-semibold text-blue-700">
                                            {event.start}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const DAYS_PER_PAGE = 4;

function addDays(date: Date, days: number) {
    var result = new Date(date); // Create a copy
    result.setDate(result.getDate() + days);
    return result;
}

export function TimetableGrid() {
    const [timetable, setTimetable] = useState<TimetableDay[]>([]);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const { token, loading } = useAuth();

    const [hoveredEvent, setHoveredEvent] = useState<TimetableEvent | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

    const allHours = Array.from({ length: 11 }, (_, i) => i + 8); // 08:00 – 18:00

    // Mouse tracking
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setTooltipPos({ x: e.clientX - 530, y: e.clientY - 200 });
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    // Fetch days
    async function fetchDays(amount: number) {
        if (!token) return;
        setLoadingMore(true);

        const startIndex = timetable.length;
        for (let i = 0; i < amount; i++) {
            try {
                const dayStr = addDays(new Date(), startIndex + i)
                    .toISOString()
                    .split("T")[0];
                const data = await fetchDayCached(dayStr, token);
                if (data) {
                    setTimetable((prev) =>
                        prev.some((d) => d.date === data.date) ? prev : [...prev, data],
                    );
                }
            } catch {
                setHasMore(false);
            }
        }

        setLoadingMore(false);
    }

    useEffect(() => {
        if (loading || !token) return;
        fetchDays(DAYS_PER_PAGE);
    }, [loading, token]);

    function eventTop(start: string) {
        const date = new Date(start);
        const h = date.getHours();
        const m = date.getMinutes();
        return ((h - 8) * 60 + m) * (64 / 60); // 64px per hour
    }

    return (
        <div className="relative">
            {loadingMore && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-50">
                    Loading...
                </div>
            )}

            <div className="max-h-[70vh] overflow-auto rounded-lg">
                <div className="flex min-w-max">
                    {/* Hour labels */}
                    <div className="mt-10 flex w-14 shrink-0 flex-col">
                        {allHours.map((h) => (
                            <div
                                key={h}
                                className="flex h-16 items-start justify-end pr-2 text-xs text-gray-400"
                            >
                                {String(h).padStart(2, "0")}:00
                            </div>
                        ))}
                    </div>

                    {/* Day columns */}
                    <div className="flex gap-1">
                        {timetable.map((day) => (
                            <div key={day.date} className="w-36 shrink-0">
                                {/* Day header */}
                                <div className="mb-1 h-10 text-center text-xs font-medium uppercase tracking-wide text-gray-500">
                                    <div>
                                        {new Date(day.date).toLocaleDateString(undefined, {
                                            weekday: "short",
                                        })}
                                    </div>
                                    <div className="text-base font-semibold text-gray-800">
                                        {new Date(day.date).toLocaleDateString(undefined, {
                                            day: "numeric",
                                            month: "short",
                                        })}
                                    </div>
                                </div>

                                {/* Grid body */}
                                <div
                                    className="relative rounded-lg border border-gray-100 bg-gray-50"
                                    style={{ height: `${allHours.length * 64}px` }}
                                >
                                    {/* Hour lines */}
                                    {allHours.map((h) => (
                                        <div
                                            key={h}
                                            className="absolute left-0 right-0 border-t border-gray-200"
                                            style={{ top: `${(h - 8) * 64}px` }}
                                        />
                                    ))}

                                    {/* Events */}
                                    {day.events.map((event, idx) => (
                                        <div
                                            key={event.id ?? `${event.title}-${event.start}-${idx}`}
                                            className="absolute left-0 right-0 mx-1 overflow-hidden rounded-md bg-blue-100 px-2 py-1 shadow-sm cursor-pointer"
                                            style={{
                                                top: `${eventTop(event.start)}px`,
                                                minHeight: "40px",
                                            }}
                                            onMouseEnter={() => setHoveredEvent(event)}
                                            onMouseLeave={() => setHoveredEvent(null)}
                                        >
                                            <p className="truncate text-xs font-semibold text-blue-900">
                                                {event.title}
                                            </p>
                                            <p className="truncate text-xs text-blue-600">
                                                {event.start} · {event.room ?? "TBC"}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tooltip */}
            {hoveredEvent && (
                <div
                    className="fixed max-w-xs bg-white rounded-lg border-black border-2 p-2 shadow-lg z-50 pointer-events-none"
                    style={{ left: tooltipPos.x, top: tooltipPos.y }}
                >
                    <span className="text-lg font-semibold">{hoveredEvent.title}</span>
                    <p className="text-blue-600">{hoveredEvent.start}</p>
                    <p>{hoveredEvent.room ?? "TBC"}</p>
                </div>
            )}
        </div>
    );
}
