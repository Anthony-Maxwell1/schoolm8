"use client";

/**
 * /lms/todo — upcoming & overdue assignments, with submission.
 *
 * Lists outstanding work (scoped to current courses), sorted by due date, and
 * lets the student submit a text entry or website URL straight to Canvas, mark
 * something done, or open it in Canvas for file uploads.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { formatDistanceToNow, isPast, parseISO } from "date-fns";
import {
    ClipboardList,
    ExternalLink,
    Send,
    Check,
    AlertCircle,
} from "lucide-react";
import {
    Text,
    Badge,
    Button,
    Spinner,
    EmptyState,
    Modal,
    Select,
    TextInput,
    Textarea,
    SearchInput,
    Alert,
} from "@/components/ui/components";
import { useAuth } from "@/context/authContext";

interface AssignmentDoc {
    id: string;
    title: string;
    courseId: string;
    courseName: string;
    dueAt?: string | null;
    url?: string;
    submission?: boolean;
    submissionState?: string;
    finishedOverride?: boolean;
}

type StatusFilter = "open" | "overdue" | "all";

function isDone(a: AssignmentDoc): boolean {
    if (a.finishedOverride === true) return true;
    if (!a.submission) return false;
    return ["submitted", "graded", "complete", "pending_review"].includes(a.submissionState ?? "");
}

export default function TodoPage() {
    const { user, token, loading } = useAuth();

    const [assignments, setAssignments] = useState<AssignmentDoc[]>([]);
    const [activeCourseIds, setActiveCourseIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);

    const [query, setQuery] = useState("");
    const [status, setStatus] = useState<StatusFilter>("open");
    const [courseFilter, setCourseFilter] = useState("");
    const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set());

    // Submit modal
    const [target, setTarget] = useState<AssignmentDoc | null>(null);
    const [submitType, setSubmitType] = useState<"text" | "url">("text");
    const [submitText, setSubmitText] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const load = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const [aRes, cRes] = await Promise.all([
                fetch("/api/lms/assignments", { headers: { Authorization: `Bearer ${token}` } }),
                fetch("/api/lms/courses", { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            const aData = aRes.ok ? await aRes.json() : { assignments: {} };
            const cData = cRes.ok ? await cRes.json() : { courses: {} };
            setAssignments(Object.values(aData.assignments ?? {}) as AssignmentDoc[]);
            setActiveCourseIds(new Set(Object.keys(cData.courses ?? {})));
        } catch {
            toast.error("Could not load your assignments");
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (!loading && user && token) load();
    }, [loading, user, token, load]);

    // Course options for the filter (only current courses that have assignments).
    const courseOptions = useMemo(() => {
        const map = new Map<string, string>();
        assignments.forEach((a) => {
            if (activeCourseIds.size === 0 || activeCourseIds.has(a.courseId)) {
                map.set(a.courseId, a.courseName);
            }
        });
        return [...map.entries()].map(([id, name]) => ({ value: id, label: name }));
    }, [assignments, activeCourseIds]);

    const visible = useMemo(() => {
        const now = Date.now();
        return assignments
            .filter((a) => activeCourseIds.size === 0 || activeCourseIds.has(a.courseId))
            .filter((a) => !a.title?.toLowerCase || a.title.toLowerCase().includes(query.toLowerCase()))
            .filter((a) => !courseFilter || a.courseId === courseFilter)
            .filter((a) => {
                const done = isDone(a) || submittedIds.has(a.id);
                const due = a.dueAt ? new Date(a.dueAt).getTime() : null;
                if (status === "all") return true;
                if (done) return false;
                if (status === "overdue") return due != null && due < now;
                // open: not done, due in the future or no due date
                return due == null || due >= now;
            })
            .sort((a, b) => {
                const da = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
                const db = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
                return da - db;
            });
    }, [assignments, activeCourseIds, query, courseFilter, status, submittedIds]);

    const openSubmit = (a: AssignmentDoc) => {
        setTarget(a);
        setSubmitType("text");
        setSubmitText("");
    };

    const doSubmit = async () => {
        if (!target || !token) return;
        if (!submitText.trim()) {
            toast.error(submitType === "url" ? "Enter a URL." : "Enter your submission text.");
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch("/api/canvas/assignments/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    assignmentId: target.id,
                    courseId: target.courseId,
                    ...(submitType === "url" ? { url: submitText.trim() } : { text: submitText }),
                }),
            });
            if (!res.ok) {
                let msg = "Canvas rejected the submission";
                try {
                    msg = (await res.json()).error ?? msg;
                } catch {
                    /* keep default */
                }
                throw new Error(msg);
            }
            setSubmittedIds((prev) => new Set(prev).add(target.id));
            setTarget(null);
            toast.success("Submitted to Canvas ✅");
        } catch (err) {
            toast.error(
                (err instanceof Error ? err.message : "Submission failed") +
                    " — this assignment may need a file upload; use “Open in Canvas”.",
            );
        } finally {
            setSubmitting(false);
        }
    };

    const dueLabel = (a: AssignmentDoc) => {
        if (!a.dueAt) return { text: "No due date", overdue: false };
        const d = parseISO(a.dueAt);
        return { text: `${isPast(d) ? "Was due" : "Due"} ${formatDistanceToNow(d, { addSuffix: true })}`, overdue: isPast(d) };
    };

    return (
        <div className="min-h-screen bg-[var(--color-surface)] px-6 py-12">
            <div className="mx-auto max-w-3xl">
                <Text variant="label" className="mb-2 block">
                    LMS
                </Text>
                <h1 className="font-[family-name:var(--font-display)] text-[42px] leading-[1.1] tracking-[-0.01em] text-[var(--color-text-primary)]">
                    To-Do
                </h1>
                <Text variant="bodyLg" className="mt-3 text-[var(--color-text-secondary)]">
                    Everything that&apos;s outstanding — submit text or a link without leaving
                    Schoolm8.
                </Text>

                {/* Filters */}
                <div className="mt-8 flex flex-wrap items-center gap-2">
                    <div className="flex gap-1">
                        {(["open", "overdue", "all"] as StatusFilter[]).map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatus(s)}
                                className={`rounded-[var(--radius-md)] px-3 py-1.5 text-sm capitalize transition-colors ${
                                    status === s
                                        ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                                        : "text-[var(--color-text-secondary)] hover:bg-[var(--color-muted)]"
                                }`}
                            >
                                {s === "open" ? "Upcoming" : s}
                            </button>
                        ))}
                    </div>
                    <div className="flex-1" />
                    {courseOptions.length > 0 && (
                        <Select
                            value={courseFilter}
                            onChange={(e) => setCourseFilter(e.target.value)}
                            options={[{ value: "", label: "All courses" }, ...courseOptions]}
                            className="w-auto"
                        />
                    )}
                </div>
                <div className="mt-2 max-w-sm">
                    <SearchInput
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onClear={() => setQuery("")}
                        placeholder="Search assignments…"
                    />
                </div>

                {/* List */}
                <div className="mt-6">
                    {isLoading ? (
                        <div className="flex items-center gap-3 py-16 text-[var(--color-text-secondary)]">
                            <Spinner size="md" /> Loading your assignments…
                        </div>
                    ) : visible.length === 0 ? (
                        <EmptyState
                            icon={<ClipboardList className="h-6 w-6" />}
                            title={status === "open" ? "You're all caught up" : "Nothing here"}
                            description={
                                assignments.length === 0
                                    ? "Connect Canvas in Settings → Integrations and sync to see your work."
                                    : "Try a different filter."
                            }
                        />
                    ) : (
                        <div className="space-y-2">
                            {visible.map((a) => {
                                const due = dueLabel(a);
                                const done = isDone(a) || submittedIds.has(a.id);
                                return (
                                    <div
                                        key={a.id}
                                        className="flex flex-wrap items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] px-4 py-3"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-medium text-[var(--color-text-primary)]">
                                                {a.title}
                                            </p>
                                            <p className="truncate text-xs text-[var(--color-text-tertiary)]">
                                                {a.courseName}
                                            </p>
                                        </div>
                                        {done ? (
                                            <Badge variant="success" dot>
                                                Done
                                            </Badge>
                                        ) : (
                                            <span
                                                className={`inline-flex items-center gap-1 text-xs ${
                                                    due.overdue
                                                        ? "text-[var(--color-danger)]"
                                                        : "text-[var(--color-text-secondary)]"
                                                }`}
                                            >
                                                {due.overdue && <AlertCircle className="h-3.5 w-3.5" />}
                                                {due.text}
                                            </span>
                                        )}
                                        <div className="flex items-center gap-1.5">
                                            {!done && (
                                                <Button
                                                    size="sm"
                                                    leftIcon={<Send className="h-3.5 w-3.5" />}
                                                    onClick={() => openSubmit(a)}
                                                >
                                                    Submit
                                                </Button>
                                            )}
                                            {a.url && (
                                                <a href={a.url} target="_blank" rel="noopener noreferrer">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        iconOnly
                                                        leftIcon={<ExternalLink className="h-4 w-4" />}
                                                        aria-label="Open in Canvas"
                                                    />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Submit modal */}
            <Modal
                open={target !== null}
                onClose={() => !submitting && setTarget(null)}
                title="Submit assignment"
                description={target?.title}
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setTarget(null)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button onClick={doSubmit} loading={submitting} leftIcon={!submitting ? <Check className="h-4 w-4" /> : undefined}>
                            Submit to Canvas
                        </Button>
                    </div>
                }
            >
                <div className="mb-3 flex gap-1">
                    {(["text", "url"] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setSubmitType(t)}
                            className={`rounded-[var(--radius-md)] px-3 py-1.5 text-sm transition-colors ${
                                submitType === t
                                    ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-muted)]"
                            }`}
                        >
                            {t === "text" ? "Text entry" : "Website URL"}
                        </button>
                    ))}
                </div>
                {submitType === "text" ? (
                    <Textarea
                        rows={6}
                        value={submitText}
                        onChange={(e) => setSubmitText(e.target.value)}
                        placeholder="Type or paste your submission…"
                        aria-label="Submission text"
                    />
                ) : (
                    <TextInput
                        value={submitText}
                        onChange={(e) => setSubmitText(e.target.value)}
                        placeholder="https://…"
                        aria-label="Submission URL"
                    />
                )}
                <Alert
                    variant="info"
                    className="mt-3"
                    description="Submitting works for assignments that accept a text entry or website URL. For file uploads, use “Open in Canvas”."
                />
            </Modal>
        </div>
    );
}
