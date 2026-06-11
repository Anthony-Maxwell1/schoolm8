"use client";

import { useCss } from "@/lib/css";
import { useRef, useState, useEffect } from "react";
import {
    Assignment, Announcement, Course,
    normaliseAnnouncement, normaliseAssignment, normaliseCourse,
} from "@/lib/lmsNormaliser";
import { useAuth } from "@/context/authContext";
import { ClassroomAnnouncement, ClassroomAssignment, ClassroomCourse } from "../api/googleclassroom/sync/route";
import { CanvasCourse, LMSAnnouncement, LMSAssignment } from "../api/canvas/sync/route";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { useAccessControl } from "@/lib/access/useAccessControl";
import { redirect } from "next/dist/client/components/navigation";
import {
    Spinner,
    EmptyState,
    Skeleton,
    Text,
    Badge,
} from "@/components/ui/components";

// ─────────────────────────────────────────────────────────────────────────────
// Card
// ─────────────────────────────────────────────────────────────────────────────

function ItemCard({ item, onClick }: { item: any; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="group relative h-52 w-72 shrink-0 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 text-left shadow-[var(--shadow-sm)] transition-[transform,shadow] duration-[var(--duration-base)] ease-[var(--ease-spring)] hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-md)]"
        >
            {item.image && (
                <img
                    src={item.image}
                    className="mb-3 h-28 w-full rounded-[var(--radius-md)] object-cover transition-transform duration-300 group-hover:scale-105"
                />
            )}
            <Text variant="h6" className="line-clamp-1 group-hover:text-[var(--color-primary)] transition-colors">
                {item.title || item.name}
            </Text>
            <Text variant="caption" className="mt-1 line-clamp-2">
                {item.description?.slice(0, 80) || item.text?.slice(0, 80) || ""}
            </Text>
            {item.due && (
                <Text variant="caption" className="mt-2 text-[var(--color-warning)]">
                    Due {new Date(item.due).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                </Text>
            )}
            {item.created && (
                <Text variant="caption" className="mt-2">
                    Posted {new Date(item.created).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                </Text>
            )}
        </button>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton carousel
// ─────────────────────────────────────────────────────────────────────────────

function CarouselSkeleton() {
    return (
        <div className="flex gap-4 overflow-hidden px-1 pb-2">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-52 w-72 shrink-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 space-y-3">
                    <Skeleton height={112} className="rounded-[var(--radius-md)]" />
                    <Skeleton variant="text" width="70%" height={16} />
                    <Skeleton variant="text" width="90%" />
                </div>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section with carousel
// ─────────────────────────────────────────────────────────────────────────────

function CarouselSection({
    title, data, redirectTemplate, loading,
}: {
    title: string; data: any[]; redirectTemplate: string; loading: boolean;
}) {
    const ref = useRef<HTMLDivElement>(null);

    const scroll = (dir: "left" | "right") => {
        ref.current?.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });
    };

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <Text variant="h3">{title}</Text>
                <div className="flex gap-1">
                    <button
                        onClick={() => scroll("left")}
                        className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-text-primary)]"
                        aria-label="Scroll left"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => scroll("right")}
                        className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-text-primary)]"
                        aria-label="Scroll right"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {loading ? (
                <CarouselSkeleton />
            ) : (
                <div
                    ref={ref}
                    className="flex gap-4 overflow-x-auto pb-2 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                    {data.map((item, i) => (
                        <ItemCard
                            key={i}
                            item={item}
                            onClick={() => redirect(redirectTemplate.replace("{id}", item.id))}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Course card
// ─────────────────────────────────────────────────────────────────────────────

function CourseCard({ course, onClick }: { course: Course; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="group relative h-40 overflow-hidden rounded-[var(--radius-xl)] cursor-pointer"
        >
            <img
                src={course.image}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                alt={course.name}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
                <Text variant="h6" className="text-white line-clamp-2 group-hover:text-[var(--color-apache-200)] transition-colors">
                    {course.name}
                </Text>
            </div>
        </button>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function LMSPage() {
    const { allowed, loading: accessLoading } = useAccessControl("lms");
    const announcementRef = useRef<HTMLDivElement>(null);
    const assignmentRef = useRef<HTMLDivElement>(null);

    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [dataLoading, setDataLoading] = useState(true);

    const { user, token, loading } = useAuth();

    useEffect(() => {
        if (loading || accessLoading || !allowed || !user || !token) return;

        Promise.all([
            fetch("/api/lms/announcements", { headers: { Authorization: `Bearer ${token}` } })
                .then((r) => r.json())
                .then((d) => setAnnouncements((Object.values(d.announcements) as (LMSAnnouncement | ClassroomAnnouncement)[]).map(normaliseAnnouncement))),
            fetch("/api/lms/assignments", { headers: { Authorization: `Bearer ${token}` } })
                .then((r) => r.json())
                .then((d) => setAssignments((Object.values(d.assignments) as (LMSAssignment | ClassroomAssignment)[]).map(normaliseAssignment))),
            fetch("/api/lms/courses", { headers: { Authorization: `Bearer ${token}` } })
                .then((r) => r.json())
                .then((d) => setCourses((Object.values(d.courses) as (ClassroomCourse | CanvasCourse)[]).map(normaliseCourse))),
        ])
            .catch((err) => console.error(err))
            .finally(() => setDataLoading(false));
    }, [user, token, loading, accessLoading, allowed]);

    if (loading || accessLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface)]">
                <div className="flex flex-col items-center gap-4">
                    <Spinner size="lg" />
                    <Text variant="bodySm">Loading…</Text>
                </div>
            </div>
        );
    }

    if (!allowed) return <div>Unauthorized</div>;

    const isEmpty = !dataLoading && announcements.length === 0 && assignments.length === 0 && courses.length === 0;

    return (
        <div className="min-h-screen bg-[var(--color-surface)]">
            <div className="mx-auto max-w-7xl space-y-12 px-6 py-10">

                {/* Header */}
                <div>
                    <Text variant="label" className="mb-2 block">Learning</Text>
                    <h1 className="font-[family-name:var(--font-display)] text-[42px] leading-[1.1] tracking-[-0.01em] font-normal text-[var(--color-text-primary)]">
                        Your <em>LMS</em>
                    </h1>
                </div>

                {isEmpty ? (
                    <EmptyState
                        icon={<BookOpen className="h-7 w-7" />}
                        title="No LMS data yet"
                        description="Set up your LMS integration in Settings to see your courses, assignments, and announcements."
                    />
                ) : (
                    <>
                        {(dataLoading || announcements.length > 0) && (
                            <CarouselSection
                                title="Announcements"
                                data={announcements}
                                redirectTemplate="/lms/announcement/{id}?cameFrom=/lms"
                                loading={dataLoading}
                            />
                        )}

                        {(dataLoading || assignments.length > 0) && (
                            <CarouselSection
                                title="Assignments"
                                data={assignments}
                                redirectTemplate="/lms/assignment/{id}?cameFrom=/lms"
                                loading={dataLoading}
                            />
                        )}

                        {(dataLoading || courses.length > 0) && (
                            <section className="space-y-4">
                                <Text variant="h3">Your Courses</Text>
                                {dataLoading ? (
                                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                                        {Array.from({ length: 4 }).map((_, i) => (
                                            <Skeleton key={i} height={160} className="rounded-[var(--radius-xl)]" />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                                        {courses.map((course, i) => (
                                            <CourseCard
                                                key={i}
                                                course={course}
                                                onClick={() => redirect(`/lms/course/${course.id}?cameFrom=/lms`)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </section>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}