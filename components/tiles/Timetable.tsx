import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/authContext";
import { css } from "@/lib/css";

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
    const style = css.components.tiles.Timetable.TimetableList;

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
        <div className={style.main["ROOT-STYLE"]}>
            <h2 className={style.main.title["ROOT-STYLE"]}>{style.main.title.CONTENT}</h2>

            {timetable.length === 0 ? (
                <p className={style.main.noclasses["ROOT-STYLE"]}>{style.main.noclasses.CONTENT}</p>
            ) : (
                <div className={style.main.inner["ROOT-STYLE"]}>
                    {timetable.map((day) => (
                        <div key={day.date} className={style.main.inner.day["ROOT-STYLE"]}>
                            <h3 className={style.main.inner.day["date-time"]["ROOT-STYLE"]}>
                                {new Date(day.date).toLocaleDateString(undefined, {
                                    weekday: "long",
                                    month: "short",
                                    day: "numeric",
                                })}
                            </h3>

                            <div className={style.main.inner.day.inner["ROOT-STYLE"]}>
                                {day.events.map((event, idx) => (
                                    <div
                                        key={event.id ?? `${event.title}-${event.start}-${idx}`}
                                        className={style.main.inner.day.inner.event["ROOT-STYLE"]}
                                    >
                                        <div
                                            className={
                                                style.main.inner.day.inner.event.main["ROOT-STYLE"]
                                            }
                                        >
                                            <p
                                                className={
                                                    style.main.inner.day.inner.event.main.name[
                                                        "ROOT-STYLE"
                                                    ]
                                                }
                                            >
                                                {event.title}
                                            </p>
                                            <p
                                                className={
                                                    style.main.inner.day.inner.event.main.room[
                                                        "ROOT-STYLE"
                                                    ]
                                                }
                                            >
                                                {event.room ?? "Room TBC"}
                                            </p>
                                        </div>
                                        <span
                                            className={
                                                style.main.inner.day.inner.event.time["ROOT-STYLE"]
                                            }
                                        >
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

    const style = css.components.tiles.Timetable.TimetableGrid;

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
        <div className={style.main["ROOT-STYLE"]}>
            {loadingMore && (
                <div className={style.main.loading["ROOT-STYLE"]}>
                    {style.main.loading["CONTENT"]}
                </div>
            )}

            <div className={style.main.inner["ROOT-STYLE"]}>
                <div className={style.main.inner.inner["ROOT-STYLE"]}>
                    {/* Hour labels */}
                    <div className={style.main.inner.inner.hourlabels["ROOT-STYLE"]}>
                        {allHours.map((h) => (
                            <div
                                key={h}
                                className={style.main.inner.inner.hourlabels.label["ROOT-STYLE"]}
                            >
                                {String(h).padStart(2, "0")}:00
                            </div>
                        ))}
                    </div>

                    {/* Day columns */}
                    <div className={style.main.inner.inner.daycolumns["ROOT-STYLE"]}>
                        {timetable.map((day) => (
                            <div
                                key={day.date}
                                className={style.main.inner.inner.daycolumns.column["ROOT-STYLE"]}
                            >
                                {/* Day header */}
                                <div
                                    className={
                                        style.main.inner.inner.daycolumns.column.header[
                                            "ROOT-STYLE"
                                        ]
                                    }
                                >
                                    <div>
                                        {new Date(day.date).toLocaleDateString(undefined, {
                                            weekday: "short",
                                        })}
                                    </div>
                                    <div
                                        className={
                                            style.main.inner.inner.daycolumns.column.header.date[
                                                "ROOT-STYLE"
                                            ]
                                        }
                                    >
                                        {new Date(day.date).toLocaleDateString(undefined, {
                                            day: "numeric",
                                            month: "short",
                                        })}
                                    </div>
                                </div>

                                {/* Grid body */}
                                <div
                                    className={
                                        style.main.inner.inner.daycolumns.column.grid["ROOT-STYLE"]
                                    }
                                    style={{ height: `${allHours.length * 64}px` }}
                                >
                                    {/* Hour lines */}
                                    {allHours.map((h) => (
                                        <div
                                            key={h}
                                            className={
                                                style.main.inner.inner.daycolumns.column.grid
                                                    .hourlines["ROOT-STYLE"]
                                            }
                                            style={{ top: `${(h - 8) * 64}px` }}
                                        />
                                    ))}

                                    {/* Events */}
                                    {day.events.map((event, idx) => (
                                        <div
                                            key={event.id ?? `${event.title}-${event.start}-${idx}`}
                                            className={
                                                style.main.inner.inner.daycolumns.column.grid.event[
                                                    "ROOT-STYLE"
                                                ]
                                            }
                                            style={{
                                                top: `${eventTop(event.start)}px`,
                                                minHeight: "40px",
                                            }}
                                            onMouseEnter={() => setHoveredEvent(event)}
                                            onMouseLeave={() => setHoveredEvent(null)}
                                        >
                                            <p
                                                className={
                                                    style.main.inner.inner.daycolumns.column.grid
                                                        .event.name["ROOT-STYLE"]
                                                }
                                            >
                                                {event.title}
                                            </p>
                                            <p
                                                className={
                                                    style.main.inner.inner.daycolumns.column.grid
                                                        .event.details["ROOT-STYLE"]
                                                }
                                            >
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
                    className={style.main.tooltip["ROOT-STYLE"]}
                    style={{ left: tooltipPos.x, top: tooltipPos.y }}
                >
                    <span className={style.main.tooltip.name["ROOT-STYLE"]}>
                        {hoveredEvent.title}
                    </span>
                    <p className={style.main.tooltip.time["ROOT-STYLE"]}>{hoveredEvent.start}</p>
                    <p>{hoveredEvent.room ?? "TBC"}</p>
                </div>
            )}
        </div>
    );
}
