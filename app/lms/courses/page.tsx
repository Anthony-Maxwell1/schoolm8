"use client";

/**
 * /lms/courses — current-year course grid.
 *
 * Reads the synced Canvas courses (the sync now keeps only active/current-year
 * enrolments). Each card links out to the course in Canvas.
 */

import { useEffect, useMemo, useState } from "react";
import { BookOpen, ExternalLink } from "lucide-react";
import { Text, Badge, Spinner, EmptyState, SearchInput, Button } from "@/components/ui/components";
import { useAuth } from "@/context/authContext";
import utils from "@/lib/utils";

interface CourseDoc {
    id: string;
    name: string;
    url?: string;
    image_download_url?: string | null;
    term?: string | null;
}

export default function LmsCoursesPage() {
    const { user, token, loading } = useAuth();
    const [courses, setCourses] = useState<CourseDoc[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [query, setQuery] = useState("");

    useEffect(() => {
        if (loading || !user || !token) return;
        setIsLoading(true);
        // fetch("/api/lms/courses", { headers: { Authorization: `Bearer ${token}` } })
        //     .then((res) => res.json())
        //     .then((data) => setCourses(Object.values(data.courses ?? {}) as CourseDoc[]))
        //     .catch(() => setCourses([]))
        //     .finally(() => setIsLoading(false));
        utils.firebase.schema.lms
            .getCourses(user.uid)
            .then((data) => setCourses(Object.values(data) as CourseDoc[]))
            .catch(() => setCourses([]))
            .finally(() => setIsLoading(false));
    }, [user, token, loading]);

    const filtered = useMemo(
        () =>
            courses
                .filter((c) => c.name?.toLowerCase().includes(query.toLowerCase()))
                .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "")),
        [courses, query],
    );

    return (
        <div className="min-h-screen bg-[var(--color-surface)] px-6 py-12">
            <div className="mx-auto max-w-5xl">
                <Text variant="label" className="mb-2 block">
                    LMS
                </Text>
                <h1 className="font-[family-name:var(--font-display)] text-[42px] leading-[1.1] tracking-[-0.01em] text-[var(--color-text-primary)]">
                    Courses
                </h1>
                <Text variant="bodyLg" className="mt-3 text-[var(--color-text-secondary)]">
                    Your current courses, synced from Canvas.
                </Text>

                <div className="mt-8 max-w-sm">
                    <SearchInput
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onClear={() => setQuery("")}
                        placeholder="Search courses…"
                    />
                </div>

                <div className="mt-6">
                    {isLoading ? (
                        <div className="flex items-center gap-3 py-16 text-[var(--color-text-secondary)]">
                            <Spinner size="md" /> Loading courses…
                        </div>
                    ) : filtered.length === 0 ? (
                        <EmptyState
                            icon={<BookOpen className="h-6 w-6" />}
                            title={query ? "No matching courses" : "No courses yet"}
                            description={
                                query
                                    ? "Try a different search."
                                    : "Connect Canvas in Settings → Integrations and sync to see your courses."
                            }
                        />
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {filtered.map((course) => (
                                <a
                                    key={course.id}
                                    href={course.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex flex-col overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] transition-colors hover:border-[var(--color-border-strong)]"
                                >
                                    <div className="relative h-24 w-full overflow-hidden bg-[var(--color-accent-subtle)]">
                                        {course.image_download_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={course.image_download_url}
                                                alt=""
                                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-[var(--color-primary)]">
                                                <BookOpen className="h-7 w-7 opacity-60" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-1 flex-col p-4">
                                        <h3 className="font-medium leading-snug text-[var(--color-text-primary)]">
                                            {course.name}
                                        </h3>
                                        <div className="mt-2 flex items-center justify-between">
                                            {course.term ? (
                                                <Badge variant="default">{course.term}</Badge>
                                            ) : (
                                                <span />
                                            )}
                                            <span className="inline-flex items-center gap-1 text-xs text-[var(--color-text-tertiary)] group-hover:text-[var(--color-primary)]">
                                                Open in Canvas
                                                <ExternalLink className="h-3 w-3" />
                                            </span>
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}
                </div>

                {!isLoading && courses.length > 0 && (
                    <div className="mt-8">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                if (!token) return;
                                fetch("/api/canvas/sync", {
                                    headers: { Authorization: `Bearer ${token}` },
                                })
                                    .then(() => location.reload())
                                    .catch(() => {});
                            }}
                        >
                            Re-sync from Canvas
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
