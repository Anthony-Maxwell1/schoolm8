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
    MapPin,
    Users,
} from "lucide-react";
import { useAccessControl } from "@/lib/access/useAccessControl";
import { useCss } from "@/lib/css";
import {
    Button,
    SearchInput,
    Select,
    Badge,
    Skeleton,
    Alert,
    EmptyState,
    Text,
    Spinner,
} from "@/components/ui/components";

// ─────────────────────────────────────────────────────────────────────────────
// Event type → badge variant
// ─────────────────────────────────────────────────────────────────────────────

type EventType = StandardEvent["type"];

const EVENT_BADGE: Record<EventType, { variant: "info" | "warning" | "primary" | "default"; label: string }> = {
    class: { variant: "info", label: "Class" },
    break: { variant: "warning", label: "Break" },
    event: { variant: "primary", label: "Event" },
    other: { variant: "default", label: "Other" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Event card — shared between grid and list
// ─────────────────────────────────────────────────────────────────────────────

function EventCard({
    event,
    showDate,
}: {
    event: StandardEvent & { date: string };
    showDate?: boolean;
}) {
    const badge = EVENT_BADGE[event.type] ?? EVENT_BADGE.other;

    return (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]">
            <div className="mb-3 flex items-start justify-between gap-3">
                <Text
                    variant="h5"
                    className="leading-snug"
                >
                    {event.title}
                </Text>
                <Badge variant={badge.variant} pill className="shrink-0">
                    {badge.label}
                </Badge>
            </div>

            <div className="space-y-1.5">
                {showDate && (
                    <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-tertiary)]" />
                        <span>
                            {new Date(event.date).toLocaleDateString("en-AU", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                            })}
                        </span>
                    </div>
                )}

                <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-tertiary)]" />
                    <span>
                        {new Date(event.start).toLocaleTimeString("en-AU", {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                        {" – "}
                        {new Date(event.end).toLocaleTimeString("en-AU", {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </span>
                </div>

                {event.room && (
                    <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-tertiary)]" />
                        <span>{event.room}</span>
                    </div>
                )}

                {event.teacher && (
                    <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                        <Users className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-tertiary)]" />
                        <span>{event.teacher}</span>
                    </div>
                )}

                {event.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-[var(--color-text-tertiary)]">
                        {event.description}
                    </p>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading skeleton
// ─────────────────────────────────────────────────────────────────────────────

function TimetableSkeleton({ viewMode }: { viewMode: "grid" | "list" }) {
    return (
        <div className="space-y-8">
            {[0, 1].map((day) => (
                <div key={day} className="space-y-3">
                    {/* Day heading */}
                    <Skeleton variant="text" width={180} height={28} />

                    {viewMode === "grid" ? (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {[0, 1, 2].map((i) => (
                                <div
                                    key={i}
                                    className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 space-y-3"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <Skeleton variant="text" width="65%" height={22} />
                                        <Skeleton variant="text" width={52} height={20} className="rounded-full shrink-0" />
                                    </div>
                                    <Skeleton variant="text" width="50%" />
                                    <Skeleton variant="text" width="40%" />
                                    <Skeleton variant="text" width="55%" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {[0, 1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 space-y-3"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <Skeleton variant="text" width="55%" height={22} />
                                        <Skeleton variant="text" width={52} height={20} className="rounded-full shrink-0" />
                                    </div>
                                    <Skeleton variant="text" width="35%" />
                                    <Skeleton variant="text" width="45%" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function TimetablePage() {
    const { allowed, loading: accessLoading } = useAccessControl("timetable");
    const { user, token, loading } = useAuth();

    const [timetableData, setTimetableData] = useState<StandardTimetable[]>([]);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [filterType, setFilterType] = useState<"all" | "class" | "break" | "event" | "other">("all");
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
            .then((results) => setTimetableData(results.filter(Boolean)))
            .catch((err) => {
                console.error("Failed to fetch timetable:", err);
                setError("Failed to load timetable. Please try again.");
            })
            .finally(() => setIsLoading(false));
    }, [user, token, loading, selectedDate, accessLoading, allowed]);

    // ── Access guards ─────────────────────────────────────────────────────
    if (loading || accessLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface)]">
                <div className="flex flex-col items-center gap-4">
                    <Spinner />
                    <Text variant="bodySm">Loading…</Text>
                </div>
            </div>
        );
    }

    if (!allowed) return <div>Unauthorized</div>;

    // ── Derived data ──────────────────────────────────────────────────────
    const getAllEvents = (): (StandardEvent & { date: string })[] =>
        timetableData.flatMap((day) =>
            day.events.map((event) => ({ ...event, date: day.date })),
        );

    const applyFilters = (events: (StandardEvent & { date: string })[]) =>
        events.filter((e) => {
            const matchesType = filterType === "all" || e.type === filterType;
            const q = searchQuery.toLowerCase();
            const matchesSearch =
                q === "" ||
                e.title.toLowerCase().includes(q) ||
                e.room?.toLowerCase().includes(q) ||
                e.teacher?.toLowerCase().includes(q);
            return matchesType && matchesSearch;
        });

    const filteredEvents = applyFilters(getAllEvents()).sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
    );

    const changeWeek = (direction: "prev" | "next") => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + (direction === "next" ? 7 : -7));
        setSelectedDate(d);
    };

    const weekLabel = selectedDate.toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[var(--color-surface)]">

            {/* ── Toolbar ── */}
            <div className="sticky top-0 z-[var(--z-sticky)] border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)]/90 backdrop-blur-md">
                <div className="mx-auto max-w-7xl px-6 py-3 space-y-3">

                    {/* Row 1: view toggle + week nav */}
                    <div className="flex items-center justify-between gap-4">

                        {/* View toggle */}
                        <div className="flex gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-muted)] p-0.5">
                            {(["grid", "list"] as const).map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    title={`${mode} view`}
                                    className={[
                                        "flex items-center justify-center rounded-[calc(var(--radius-md)-2px)] p-1.5 transition-colors duration-[var(--duration-fast)]",
                                        viewMode === mode
                                            ? "bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] shadow-[var(--shadow-sm)]"
                                            : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]",
                                    ].join(" ")}
                                >
                                    {mode === "grid"
                                        ? <Grid3x3 className="h-4 w-4" />
                                        : <List className="h-4 w-4" />
                                    }
                                </button>
                            ))}
                        </div>

                        {/* Week nav */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                iconOnly
                                aria-label="Previous week"
                                leftIcon={<ChevronLeft className="h-4 w-4" />}
                                onClick={() => changeWeek("prev")}
                            />
                            <div className="min-w-32 text-center">
                                <Text variant="caption" className="block">Week of</Text>
                                <Text variant="bodySm" className="font-medium text-[var(--color-text-primary)]">
                                    {weekLabel}
                                </Text>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                iconOnly
                                aria-label="Next week"
                                leftIcon={<ChevronRight className="h-4 w-4" />}
                                onClick={() => changeWeek("next")}
                            />
                        </div>
                    </div>

                    {/* Row 2: search + filter */}
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <SearchInput
                                placeholder="Search by class, room, or teacher…"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onClear={() => setSearchQuery("")}
                            />
                        </div>
                        <Select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as typeof filterType)}
                            options={[
                                { value: "all", label: "All events" },
                                { value: "class", label: "Classes" },
                                { value: "break", label: "Breaks" },
                                { value: "event", label: "Events" },
                                { value: "other", label: "Other" },
                            ]}
                            className="w-36"
                        />
                    </div>
                </div>
            </div>

            {/* ── Main content ── */}
            <div className="mx-auto max-w-7xl px-6 py-8">

                {/* Error */}
                {error && !isLoading && (
                    <Alert
                        variant="danger"
                        title="Failed to load timetable"
                        description={error}
                        className="mb-6"
                    />
                )}

                {/* Loading skeleton */}
                {isLoading && <TimetableSkeleton viewMode={viewMode} />}

                {/* Empty — no data at all */}
                {!isLoading && !error && timetableData.length === 0 && (
                    <EmptyState
                        icon={<Calendar className="h-7 w-7" />}
                        title="No timetable data"
                        description="Your timetable hasn't been set up yet. Go to settings to configure it."
                    />
                )}

                {/* Grid view */}
                {!isLoading && !error && timetableData.length > 0 && viewMode === "grid" && (
                    <div className="space-y-10">
                        {timetableData.map((day) => {
                            const dayEvents = applyFilters(
                                day.events.map((e) => ({ ...e, date: day.date })),
                            );
                            const dayName = new Date(day.date).toLocaleDateString("en-AU", {
                                weekday: "long",
                                month: "short",
                                day: "numeric",
                            });

                            return (
                                <div key={day.date} className="space-y-4">
                                    <Text variant="h3">{dayName}</Text>

                                    {dayEvents.length === 0 ? (
                                        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-muted)] px-6 py-8 text-center">
                                            <Text variant="bodySm">No events scheduled</Text>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                            {dayEvents.map((event, idx) => (
                                                <EventCard key={idx} event={event} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* List view */}
                {!isLoading && !error && timetableData.length > 0 && viewMode === "list" && (
                    filteredEvents.length === 0 ? (
                        <EmptyState
                            icon={<Calendar className="h-7 w-7" />}
                            title="No events found"
                            description="Try adjusting your search or filter."
                        />
                    ) : (
                        <div className="space-y-3">
                            {filteredEvents.map((event, idx) => (
                                <EventCard key={idx} event={event} showDate />
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>
    );
}