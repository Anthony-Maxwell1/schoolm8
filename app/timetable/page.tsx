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

export default function TimetablePage() {
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

    useEffect(() => {
        if (loading || !user || !token) return;

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
    }, [user, token, loading, selectedDate]);

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
            <div className="sticky top-14 md:top-0 z-20 bg-slate-950/95 backdrop-blur-md border-b border-slate-700/70 px-6 py-4 space-y-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`p-2 rounded-lg border transition-all ${
                                    viewMode === "grid"
                                        ? "bg-emerald-500 text-slate-950 border-emerald-400"
                                        : "bg-slate-900 text-slate-100 border-slate-700 hover:bg-slate-800"
                                }`}
                                title="Grid view"
                            >
                                <Grid3x3 className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={`p-2 rounded-lg border transition-all ${
                                    viewMode === "list"
                                        ? "bg-emerald-500 text-slate-950 border-emerald-400"
                                        : "bg-slate-900 text-slate-100 border-slate-700 hover:bg-slate-800"
                                }`}
                                title="List view"
                            >
                                <List className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex items-center justify-center gap-4">
                            <button
                                onClick={() => changeWeek("prev")}
                                className="p-2 rounded-lg bg-slate-900 text-slate-100 border border-slate-700 hover:bg-slate-800 transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="text-center min-w-50">
                                <p className="text-slate-300 text-sm">Week of</p>
                                <p className="text-white font-semibold">
                                    {selectedDate.toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                    })}
                                </p>
                            </div>
                            <button
                                onClick={() => changeWeek("next")}
                                className="p-2 rounded-lg bg-slate-900 text-slate-100 border border-slate-700 hover:bg-slate-800 transition-colors"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Search & Filter */}
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by class, room, or teacher..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-900/90 border border-slate-700 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 transition-all"
                            />
                        </div>

                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as any)}
                            className="px-4 py-2 rounded-lg bg-slate-900/90 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 transition-all"
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
            <div className="max-w-7xl mx-auto px-6 py-12">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-slate-700 border-t-emerald-400 rounded-full animate-spin" />
                            <p className="text-slate-300">Loading timetable...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                            <h2 className="text-2xl font-semibold text-white mb-2">Error</h2>
                            <p className="text-slate-300">{error}</p>
                        </div>
                    </div>
                ) : timetableData.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <Calendar className="w-16 h-16 text-slate-500 mx-auto mb-4 opacity-60" />
                            <h2 className="text-2xl font-semibold text-slate-100 mb-2">
                                No timetable data
                            </h2>
                            <p className="text-slate-300">
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
                                <div key={day.date} className="space-y-4">
                                    <h2 className="text-2xl font-bold text-white">{dayName}</h2>

                                    {dayEvents.length === 0 ? (
                                        <div className="bg-slate-950/70 border border-slate-700 rounded-lg p-8 text-center">
                                            <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-60" />
                                            <p className="text-slate-300">No events scheduled</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {dayEvents.map((event, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`border rounded-lg p-4 backdrop-blur transition-all hover:shadow-lg hover:shadow-black/20 ${getEventColor(
                                                        event.type,
                                                    )}`}
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h3 className="font-semibold text-lg text-white">
                                                            {event.title}
                                                        </h3>
                                                        <span className="text-xs uppercase tracking-wide font-bold opacity-90">
                                                            {event.type}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2 mb-2 text-sm opacity-95">
                                                        <Clock className="w-4 h-4" />
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
                                                        <div className="flex items-center gap-2 mb-2 text-sm opacity-95">
                                                            <MapPin className="w-4 h-4" />
                                                            <span>{event.room}</span>
                                                        </div>
                                                    )}

                                                    {event.teacher && (
                                                        <div className="flex items-center gap-2 text-sm opacity-95">
                                                            <Users className="w-4 h-4" />
                                                            <span>{event.teacher}</span>
                                                        </div>
                                                    )}

                                                    {event.description && (
                                                        <p className="text-sm opacity-85 mt-3 line-clamp-2">
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
                            <div className="bg-slate-950/70 border border-slate-700 rounded-lg p-8 text-center">
                                <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-60" />
                                <p className="text-slate-300">No events found</p>
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
                                                    <h3 className="font-semibold text-lg text-white">
                                                        {event.title}
                                                    </h3>
                                                    <span className="text-xs uppercase tracking-wide font-bold opacity-90">
                                                        {event.type}
                                                    </span>
                                                </div>

                                                <div className="text-sm opacity-95 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4" />
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
                                                        <Clock className="w-4 h-4" />
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
                                                            <MapPin className="w-4 h-4" />
                                                            <span>{event.room}</span>
                                                        </div>
                                                    )}

                                                    {event.teacher && (
                                                        <div className="flex items-center gap-2">
                                                            <Users className="w-4 h-4" />
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
