"use client";

import { useAuth } from "@/context/authContext";
import { useEffect, useState } from "react";
import { StandardTimetable, StandardEvent, getWeekDates } from "@/lib/timetableNormaliser";
import {
    Clock,
    Calendar,
    List,
    Grid3x3,
    ChevronLeft,
    ChevronRight,
    Search,
    AlertCircle,
    MapPin,
    Users,
} from "lucide-react";
import { useAccessControl } from "@/lib/access/useAccessControl";
import { useCss } from "@/lib/css";

export default function TimetablePage() {
    const { allowed, loading: accessLoading } = useAccessControl("timetable");
    const { user, token, loading } = useAuth();
    const [timetableData, setTimetableData] = useState<StandardTimetable[]>([]);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [filterType, setFilterType] = useState<"all" | "class" | "break" | "event" | "other">(
        "all",
    );
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { css } = useCss();
    const style = css.app.timetable.page;

    useEffect(() => {
        if (loading || accessLoading || !allowed || !user || !token) return;

        setIsLoading(true);
        setError(null);

        const currentDate = selectedDate.toISOString().split("T")[0];
        const weekDates = getWeekDates(currentDate);

        Promise.all(
            weekDates.map((date) =>
                fetch(`/api/timetable/fetch?day=${date}`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                })
                    .then((res) => res.json())
                    .then((data) => data.timetable || null),
            ),
        )
            .then((results) => {
                const validData = results.filter((d) => d !== null);
                setTimetableData(validData);
            })
            .catch((err) => {
                console.error("Failed to fetch timetable:", err);
                setError("Failed to load timetable");
            })
            .finally(() => setIsLoading(false));
    }, [user, token, loading, selectedDate, accessLoading, allowed]);

    if (loading || accessLoading) {
        return (
            <div className={style.loading["ROOT-STYLE"]}>
                <div className={style.loading.inner["ROOT-STYLE"]}>
                    <div className={style.loading.spinner["ROOT-STYLE"]} />
                    <p className={style.loading.text["ROOT-STYLE"]}>Loading...</p>
                </div>
            </div>
        );
    }

    if (!allowed) {
        return <div>Unauthorized</div>;
    }

    const getAllEvents = (): (StandardEvent & { date: string })[] => {
        return timetableData.flatMap((day) =>
            day.events.map((event) => ({ ...event, date: day.date })),
        );
    };

    const filteredEvents = getAllEvents().filter((event) => {
        const matchesType = filterType === "all" || event.type === filterType;
        const matchesSearch =
            searchQuery === "" ||
            event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.room?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.teacher?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesSearch;
    });

    const changeWeek = (direction: "prev" | "next") => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
        setSelectedDate(newDate);
    };

    const getEventColor = (type: StandardEvent["type"]) => {
        switch (type) {
            case "class":
                return "bg-blue-950/80 border-blue-300/30 text-blue-50";
            case "break":
                return "bg-amber-950/80 border-amber-300/30 text-amber-50";
            case "event":
                return "bg-purple-950/80 border-purple-300/30 text-purple-50";
            default:
                return "bg-slate-950/80 border-slate-600 text-slate-50";
        }
    };

    return (
        <div>
            {/* Toolbar */}
            <div className={style.toolbar["ROOT-STYLE"]}>
                <div className={style.toolbarInner["ROOT-STYLE"]}>
                    <div className={style.toolbarRow["ROOT-STYLE"]}>
                        <div className={style.viewToggleGroup["ROOT-STYLE"]}>
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`${style.viewButton["ROOT-STYLE"]} ${
                                    viewMode === "grid"
                                        ? style.viewButton.active
                                        : style.viewButton.inactive
                                }`}
                                title="Grid view"
                            >
                                <Grid3x3 className="h-5 w-5" />
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={`${style.viewButton["ROOT-STYLE"]} ${
                                    viewMode === "list"
                                        ? style.viewButton.active
                                        : style.viewButton.inactive
                                }`}
                                title="List view"
                            >
                                <List className="h-5 w-5" />
                            </button>
                        </div>

                        <div className={style.weekNav["ROOT-STYLE"]}>
                            <button
                                onClick={() => changeWeek("prev")}
                                className={style.weekButton["ROOT-STYLE"]}
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <div className={style.weekInfo["ROOT-STYLE"]}>
                                <p className={style.weekLabel["ROOT-STYLE"]}>
                                    {style.weekLabel.CONTENT}
                                </p>
                                <p className={style.weekDate["ROOT-STYLE"]}>
                                    {selectedDate.toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                    })}
                                </p>
                            </div>
                            <button
                                onClick={() => changeWeek("next")}
                                className={style.weekButton["ROOT-STYLE"]}
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Search & Filter */}
                    <div className={style.searchRow["ROOT-STYLE"]}>
                        <div className={style.searchWrap["ROOT-STYLE"]}>
                            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by class, room, or teacher..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={style.searchInput["ROOT-STYLE"]}
                            />
                        </div>

                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as any)}
                            className={style.filterSelect["ROOT-STYLE"]}
                        >
                            <option value="all">All Events</option>
                            <option value="class">Classes</option>
                            <option value="break">Breaks</option>
                            <option value="event">Events</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className={style.content["ROOT-STYLE"]}>
                {isLoading ? (
                    <div className={style.loading["ROOT-STYLE"]}>
                        <div className={style.loading.inner["ROOT-STYLE"]}>
                            <div className={style.loading.spinner["ROOT-STYLE"]} />
                            <p className={style.loading.text["ROOT-STYLE"]}>Loading timetable...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className={style.loading["ROOT-STYLE"]}>
                        <div className={style.errorCard["ROOT-STYLE"]}>
                            <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-400" />
                            <h2 className={style.errorCard.title["ROOT-STYLE"]}>
                                {style.errorCard.title.CONTENT}
                            </h2>
                            <p className={style.errorCard.text["ROOT-STYLE"]}>{error}</p>
                        </div>
                    </div>
                ) : timetableData.length === 0 ? (
                    <div className={style.loading["ROOT-STYLE"]}>
                        <div className={style.errorCard["ROOT-STYLE"]}>
                            <Calendar className={style.emptyCard.icon["ROOT-STYLE"]} />
                            <h2 className="mb-2 text-2xl font-semibold text-slate-100">
                                No timetable data
                            </h2>
                            <p className={style.emptyCard.text["ROOT-STYLE"]}>
                                Your timetable hasn&apos;t been set up yet. Go to settings to
                                configure it.
                            </p>
                        </div>
                    </div>
                ) : viewMode === "grid" ? (
                    <div className="space-y-8">
                        {timetableData.map((day) => {
                            const dayName = new Date(day.date).toLocaleDateString("en-US", {
                                weekday: "long",
                                month: "short",
                                day: "numeric",
                            });

                            const dayEvents = day.events
                                .filter((e) => filterType === "all" || e.type === filterType)
                                .filter(
                                    (e) =>
                                        searchQuery === "" ||
                                        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        e.room?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        e.teacher
                                            ?.toLowerCase()
                                            .includes(searchQuery.toLowerCase()),
                                );

                            return (
                                <div key={day.date} className={style.daySection["ROOT-STYLE"]}>
                                    <h2 className={style.dayTitle["ROOT-STYLE"]}>{dayName}</h2>

                                    {dayEvents.length === 0 ? (
                                        <div className={style.emptyCard["ROOT-STYLE"]}>
                                            <Calendar
                                                className={style.emptyCard.icon["ROOT-STYLE"]}
                                            />
                                            <p className={style.emptyCard.text["ROOT-STYLE"]}>
                                                No events scheduled
                                            </p>
                                        </div>
                                    ) : (
                                        <div className={style.grid["ROOT-STYLE"]}>
                                            {dayEvents.map((event, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`border rounded-lg p-4 backdrop-blur transition-all hover:shadow-lg hover:shadow-black/20 ${getEventColor(
                                                        event.type,
                                                    )}`}
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h3 className="text-lg font-semibold text-white">
                                                            {event.title}
                                                        </h3>
                                                        <span className="text-xs font-bold uppercase tracking-wide opacity-90">
                                                            {event.type}
                                                        </span>
                                                    </div>

                                                    <div className={style.cardMeta["ROOT-STYLE"]}>
                                                        <Clock className="h-4 w-4" />
                                                        <span>
                                                            {new Date(
                                                                event.start,
                                                            ).toLocaleTimeString("en-US", {
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            })}{" "}
                                                            -{" "}
                                                            {new Date(event.end).toLocaleTimeString(
                                                                "en-US",
                                                                {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                },
                                                            )}
                                                        </span>
                                                    </div>

                                                    {event.room && (
                                                        <div
                                                            className={style.cardMeta["ROOT-STYLE"]}
                                                        >
                                                            <MapPin className="h-4 w-4" />
                                                            <span>{event.room}</span>
                                                        </div>
                                                    )}

                                                    {event.teacher && (
                                                        <div
                                                            className={style.cardMeta["ROOT-STYLE"]}
                                                        >
                                                            <Users className="h-4 w-4" />
                                                            <span>{event.teacher}</span>
                                                        </div>
                                                    )}

                                                    {event.description && (
                                                        <p className={style.cardDesc["ROOT-STYLE"]}>
                                                            {event.description}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredEvents.length === 0 ? (
                            <div className={style.emptyCard["ROOT-STYLE"]}>
                                <Calendar className={style.emptyCard.icon["ROOT-STYLE"]} />
                                <p className={style.emptyCard.text["ROOT-STYLE"]}>
                                    No events found
                                </p>
                            </div>
                        ) : (
                            filteredEvents
                                .sort(
                                    (a, b) =>
                                        new Date(a.start).getTime() - new Date(b.start).getTime(),
                                )
                                .map((event, idx) => (
                                    <div
                                        key={idx}
                                        className={`border rounded-lg p-4 backdrop-blur transition-all hover:shadow-lg hover:shadow-black/20 ${getEventColor(
                                            event.type,
                                        )}`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="text-lg font-semibold text-white">
                                                        {event.title}
                                                    </h3>
                                                    <span className="text-xs font-bold uppercase tracking-wide opacity-90">
                                                        {event.type}
                                                    </span>
                                                </div>

                                                <div className="text-sm opacity-95 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4" />
                                                        <span>
                                                            {new Date(
                                                                event.date,
                                                            ).toLocaleDateString("en-US", {
                                                                weekday: "short",
                                                                month: "short",
                                                                day: "numeric",
                                                            })}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-4 w-4" />
                                                        <span>
                                                            {new Date(
                                                                event.start,
                                                            ).toLocaleTimeString("en-US", {
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            })}{" "}
                                                            -{" "}
                                                            {new Date(event.end).toLocaleTimeString(
                                                                "en-US",
                                                                {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                },
                                                            )}
                                                        </span>
                                                    </div>

                                                    {event.room && (
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="h-4 w-4" />
                                                            <span>{event.room}</span>
                                                        </div>
                                                    )}

                                                    {event.teacher && (
                                                        <div className="flex items-center gap-2">
                                                            <Users className="h-4 w-4" />
                                                            <span>{event.teacher}</span>
                                                        </div>
                                                    )}

                                                    {event.description && (
                                                        <p className="text-sm opacity-85 mt-2">
                                                            {event.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
