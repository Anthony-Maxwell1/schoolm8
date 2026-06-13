/**
 * lib/ai/context.ts
 *
 * Assembles grounding context for the AI Tutor from the user's already-synced
 * Canvas/LMS data in Firestore. The goal is a compact, high-signal system
 * prompt: prioritise upcoming and overdue work, summarise the long tail, and
 * stay well within token limits. One assignment can be "attached" for full
 * detail (description + rubric).
 */

import { getLMSAssignments, getLMSAnnouncements, getLMSCourses } from "@/lib/firebaseSchema";

// Rough budgets — kept conservative so we never blow the context window.
const MAX_UPCOMING = 25;
const MAX_OVERDUE = 15;
const MAX_ANNOUNCEMENTS = 12;
const MAX_DESC_CHARS = 260;
const MAX_ATTACHED_DESC_CHARS = 4000;

interface StoredAssignment {
    id: string;
    title: string;
    description?: string;
    courseId: string;
    courseName: string;
    dueAt?: string | null;
    url?: string;
    submission?: boolean;
    submissionState?: string;
    submittedAt?: string | null;
    missing?: boolean;
    finishedOverride?: boolean;
    rubric?: Record<string, string[]>;
}

interface StoredAnnouncement {
    id: string;
    title?: string;
    message?: string;
    courseName?: string;
    postedAt?: string;
}

export interface TutorContextResult {
    systemInstruction: string;
    stats: {
        courses: number;
        upcoming: number;
        overdue: number;
        announcements: number;
        attached: boolean;
    };
}

function isDone(a: StoredAssignment): boolean {
    if (a.finishedOverride === true) return true;
    if (!a.submission) return false;
    return ["submitted", "graded", "complete", "pending_review"].includes(
        a.submissionState ?? "",
    );
}

function truncate(text: string, max: number): string {
    const clean = (text ?? "").replace(/\s+/g, " ").trim();
    return clean.length > max ? clean.slice(0, max).trimEnd() + "…" : clean;
}

function formatDue(dueAt?: string | null): string {
    if (!dueAt) return "no due date";
    const d = new Date(dueAt);
    if (Number.isNaN(d.getTime())) return "no due date";
    return d.toISOString().slice(0, 16).replace("T", " ") + " UTC";
}

function assignmentLine(a: StoredAssignment, includeDesc: boolean): string {
    const parts = [
        `• [${a.id}] "${a.title}" — ${a.courseName} — due ${formatDue(a.dueAt)}`,
        `submission: ${isDone(a) ? "done" : a.submission ? a.submissionState : "not submitted"}`,
    ];
    let line = parts.join(" — ");
    if (includeDesc && a.description) {
        line += `\n    ${truncate(a.description, MAX_DESC_CHARS)}`;
    }
    return line;
}

function attachedBlock(a: StoredAssignment): string {
    const lines = [
        `ATTACHED ASSIGNMENT (the student wants help with THIS specifically):`,
        `Title: ${a.title}`,
        `Course: ${a.courseName}`,
        `Due: ${formatDue(a.dueAt)}`,
        `Status: ${isDone(a) ? "done" : a.submission ? a.submissionState : "not submitted"}`,
        a.url ? `Link: ${a.url}` : "",
        a.description ? `Description:\n${truncate(a.description, MAX_ATTACHED_DESC_CHARS)}` : "",
    ];
    if (a.rubric && Object.keys(a.rubric).length > 0) {
        lines.push("Rubric:");
        for (const [criterion, levels] of Object.entries(a.rubric)) {
            lines.push(`  - ${criterion}: ${levels.join(" / ")}`);
        }
    }
    return lines.filter(Boolean).join("\n");
}

export async function assembleTutorContext(
    uid: string,
    attachedAssignmentId?: string,
): Promise<TutorContextResult> {
    const [coursesMap, assignmentsMap, announcementsMap] = await Promise.all([
        getLMSCourses(uid),
        getLMSAssignments(uid),
        getLMSAnnouncements(uid),
    ]);

    const courses = Object.values(coursesMap ?? {}) as { name: string }[];
    const assignments = Object.values(assignmentsMap ?? {}) as StoredAssignment[];
    const announcements = Object.values(announcementsMap ?? {}) as StoredAnnouncement[];

    const now = Date.now();

    const upcoming = assignments
        .filter((a) => a.dueAt && new Date(a.dueAt).getTime() >= now && !isDone(a))
        .sort((a, b) => new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime())
        .slice(0, MAX_UPCOMING);

    const overdue = assignments
        .filter((a) => a.dueAt && new Date(a.dueAt).getTime() < now && !isDone(a))
        .sort((a, b) => new Date(b.dueAt!).getTime() - new Date(a.dueAt!).getTime())
        .slice(0, MAX_OVERDUE);

    const recentAnnouncements = announcements
        .filter((x) => x.postedAt)
        .sort((a, b) => new Date(b.postedAt!).getTime() - new Date(a.postedAt!).getTime())
        .slice(0, MAX_ANNOUNCEMENTS);

    const doneCount = assignments.filter(isDone).length;

    const attached =
        attachedAssignmentId != null
            ? (assignmentsMap?.[attachedAssignmentId] as StoredAssignment | undefined)
            : undefined;

    const sections: string[] = [];

    sections.push(
        `You are SchoolMate, an AI tutor built into the student's school dashboard. ` +
            `You already know everything in their Canvas/LMS account (shown below) and should ` +
            `use it to give specific, grounded help. Be encouraging, concise, and accurate. ` +
            `When the student asks "what's due", reason from the data below and today's date. ` +
            `Help them learn and plan — do not simply write graded work for them to submit; ` +
            `explain, scaffold, and check understanding. Use Markdown. Use LaTeX ($...$ and ` +
            `$$...$$) for maths and fenced code blocks for code.`,
    );

    sections.push(`Today's date (UTC): ${new Date(now).toISOString().slice(0, 10)}.`);

    if (courses.length) {
        sections.push(
            `STUDENT'S COURSES (${courses.length}):\n` +
                courses.map((c) => `• ${c.name}`).join("\n"),
        );
    } else {
        sections.push(
            `The student has not synced any courses yet. Gently suggest connecting Canvas in Settings → Integrations if they ask about their classes.`,
        );
    }

    if (upcoming.length) {
        sections.push(
            `UPCOMING ASSIGNMENTS (${upcoming.length}, soonest first):\n` +
                upcoming.map((a) => assignmentLine(a, true)).join("\n"),
        );
    }

    if (overdue.length) {
        sections.push(
            `OVERDUE / NOT YET SUBMITTED (${overdue.length}, most recent first):\n` +
                overdue.map((a) => assignmentLine(a, false)).join("\n"),
        );
    }

    sections.push(
        `WORKLOAD SUMMARY: ${assignments.length} assignments total, ${doneCount} completed, ` +
            `${upcoming.length} upcoming, ${overdue.length} overdue.`,
    );

    if (recentAnnouncements.length) {
        sections.push(
            `RECENT ANNOUNCEMENTS (${recentAnnouncements.length}):\n` +
                recentAnnouncements
                    .map(
                        (x) =>
                            `• ${x.courseName ?? "Course"} — "${x.title ?? "Announcement"}": ${truncate(
                                x.message ?? "",
                                160,
                            )}`,
                    )
                    .join("\n"),
        );
    }

    if (attached) {
        sections.push(attachedBlock(attached));
    }

    return {
        systemInstruction: sections.join("\n\n"),
        stats: {
            courses: courses.length,
            upcoming: upcoming.length,
            overdue: overdue.length,
            announcements: recentAnnouncements.length,
            attached: Boolean(attached),
        },
    };
}
