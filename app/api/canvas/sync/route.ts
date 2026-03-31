// app/api/canvas/sync/route.ts
import { NextResponse } from "next/server";
import { db, auth } from "@/lib/firebaseAdmin";
import { htmlToText } from "html-to-text";

/* =========================
   Canvas API Types
========================= */

export type CanvasCourse = {
    id: number;
    name: string;
    html_url: string;
};

export type CanvasAssignment = {
    id: number;
    name: string;
    description: string;
    due_at: string | null;
    html_url: string;
};

export type CanvasSubmission = {
    submitted_at: string | null;
    workflow_state: string;
};

export type CanvasAnnouncement = {
    id: number;
    title: string;
    message: string;
    posted_at: string;
    html_url: string;
};

/* =========================
   App (LMS) Types
========================= */

export type LMSAssignment = {
    id: string;
    title: string;
    description: string;
    courseId: string;
    courseName: string;
    dueAt: string | null;
    url: string;

    submission: boolean;
    submissionState: string;
    submittedAt: string | null;

    projects: any[];
    missing: boolean;

    rawCanvasData: CanvasAssignment;

    updatedAt: string;
    createdAt: string;

    overriddenFields: string[];
};

export type LMSAnnouncement = {
    id: string;
    title: string;
    message: string;
    courseId: string;
    courseName: string;
    postedAt: string;
    url: string;

    updatedAt: string;
};

/* =========================
   Final Sync Result Type
========================= */

export type CanvasSyncResult = {
    assignments: Record<string, LMSAssignment>;
    announcements: Record<string, LMSAnnouncement>;
    courses: Record<string, any>;
};

/* =========================
   Helpers
========================= */

function cleanUndefined(obj: any): any {
    if (Array.isArray(obj)) return obj.map(cleanUndefined);
    if (obj !== null && typeof obj === "object") {
        const out: any = {};
        for (const key in obj) {
            const value = obj[key];
            out[key] = value === undefined ? null : cleanUndefined(value);
        }
        return out;
    }
    return obj;
}

function sanitizeHTML(input?: string): string {
    if (!input) return "";
    return htmlToText(input, {}).trim();
}

/* =========================
   Route
========================= */

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer "))
            return NextResponse.json(
                { error: "Missing or invalid Authorization header" },
                { status: 401 },
            );

        const idToken = authHeader.split(" ")[1];

        const decodedToken = await auth.verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const { assignments, announcements, courses } = await syncCanvasForUser(userId);

        return NextResponse.json({
            status: "ok",
            assignments,
            announcements,
            courses,
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/* =========================
   Core Sync Logic
========================= */

async function fetchAllPages(url: string, token: string) {
    let results: any[] = [];
    let nextUrl: string | null = url;

    while (nextUrl) {
        const res: any = await fetch(nextUrl, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) break;

        const data = await res.json();
        results.push(...data);

        const linkHeader = res.headers.get("link");

        const nextLink = linkHeader
            ?.split(",")
            .find((l: string) => l.includes('rel="next"'))
            ?.match(/<(.+?)>/)?.[1];

        nextUrl = nextLink || null;
    }

    return results;
}

async function syncCanvasForUser(userId: string): Promise<CanvasSyncResult> {
    const userRef = db.collection("users").doc(userId);
    const doc = await userRef.get();
    if (!doc.exists) throw new Error("User not found");

    const userData = doc.data();
    const canvasToken = userData?.canvasToken;
    const canvasBaseUrl = userData?.info?.canvasBaseUrl;

    if (!canvasToken || !canvasBaseUrl) {
        throw new Error("Missing Canvas token or base URL");
    }

    /* =========================
       Helpers
    ========================= */

    const fetchJson = async (url: string) => {
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${canvasToken}` },
        });
        return res.ok ? res.json() : null;
    };

    const fetchAllPages = async (url: string) => {
        let results: any[] = [];
        let nextUrl: string | null = url;

        while (nextUrl) {
            const res: any = await fetch(nextUrl, {
                headers: { Authorization: `Bearer ${canvasToken}` },
            });

            if (!res.ok) break;

            const data = await res.json();
            results.push(...data);

            const linkHeader = res.headers.get("link");

            const nextLink = linkHeader
                ?.split(",")
                .find((l: string) => l.includes('rel="next"'))
                ?.match(/<(.+?)>/)?.[1];

            nextUrl = nextLink || null;
        }

        return results;
    };

    /* =========================
       Fetch Courses
    ========================= */

    const courses: CanvasCourse[] = (await fetchJson(`${canvasBaseUrl}/api/v1/courses`)) || [];

    const courseMap = Object.fromEntries(courses.map((c) => [c.id.toString(), c.name]));

    /* =========================
       Fetch Assignments (PARALLEL)
    ========================= */

    const assignmentPromises: Promise<any>[] = [];

    for (const course of courses) {
        let url = `${canvasBaseUrl}/api/v1/courses/${course.id}/assignments?include[]=submission`;
        const promise = fetchAllPages(url).then((assignments) => ({ course, assignments }));
        assignmentPromises.push(promise);
    }

    const assignmentResults = await Promise.all(assignmentPromises);

    /* =========================
       Fetch Announcements (ONCE)
    ========================= */

    const contextCodes = courses.map((c) => `course_${c.id}`).join("&context_codes[]=");

    const allAnnouncements = await fetchAllPages(
        `${canvasBaseUrl}/api/v1/announcements?context_codes[]=${contextCodes}&start_date=2000-01-01T00:00:00Z&end_date=2100-01-01T00:00:00Z&per_page=100`,
    );

    /* =========================
       Build Data
    ========================= */

    const existingAssignments: Record<string, LMSAssignment> = userData?.data?.assignments || {};

    const updatedAssignments: Record<string, LMSAssignment> = {};
    const updatedAnnouncements: Record<string, LMSAnnouncement> = {};

    const seenIds = new Set<string>();

    /* ---------- Assignments ---------- */

    for (const { course, assignments } of assignmentResults) {
        for (const a of assignments) {
            const id = a.id.toString();
            seenIds.add(id);

            const existing = existingAssignments[id];
            const overriddenKeys: string[] = existing?.overriddenFields || [];

            const submission = a.submission || null;

            const assignment: LMSAssignment = {
                id,
                title: a.name,
                description: sanitizeHTML(a.description),
                courseId: course.id.toString(),
                courseName: course.name,
                dueAt: a.due_at ? new Date(a.due_at).toISOString() : null,
                url: a.html_url,

                submission: !!submission,
                submissionState: submission?.workflow_state || "unsubmitted",
                submittedAt: submission?.submitted_at || null,

                projects: existing?.projects || [],
                missing: false,

                rawCanvasData: a,

                updatedAt: new Date().toISOString(),
                createdAt: existing?.createdAt || new Date().toISOString(),

                overriddenFields: overriddenKeys,
            };

            for (const key of overriddenKeys) {
                if (existing && key in existing) {
                    (assignment as any)[key] = (existing as any)[key];
                }
            }

            updatedAssignments[id] = assignment;
        }
    }

    /* ---------- Announcements ---------- */

    for (const ann of allAnnouncements) {
        const id = ann.id.toString();

        const courseId = ann.context_code?.replace("course_", "") || "";

        updatedAnnouncements[id] = {
            id,
            title: ann.title,
            message: sanitizeHTML(ann.message),
            courseId,
            courseName: courseMap[courseId] || "Unknown Course",
            postedAt: new Date(ann.posted_at).toISOString(),
            url: ann.html_url,
            updatedAt: new Date().toISOString(),
        };
    }

    /* ---------- Missing Assignments ---------- */

    for (const id of Object.keys(existingAssignments)) {
        if (!seenIds.has(id)) {
            updatedAssignments[id] = {
                ...existingAssignments[id],
                missing: true,
                updatedAt: new Date().toISOString(),
            };
        }
    }

    /* ---------- Courses Map ---------- */

    const coursesMap: Record<string, any> = {};
    for (const c of courses) {
        coursesMap[c.id.toString()] = {
            id: c.id.toString(),
            name: c.name,
            url: `${canvasBaseUrl}/courses/${c.id}`,
            updatedAt: new Date().toISOString(),
        };
    }

    /* =========================
       Save
    ========================= */

    await userRef.set(
        {
            data: {
                assignments: cleanUndefined(updatedAssignments),
                announcements: cleanUndefined(updatedAnnouncements),
                courses: cleanUndefined(coursesMap),
            },
        },
        { merge: true },
    );

    return {
        assignments: updatedAssignments,
        announcements: updatedAnnouncements,
        courses: coursesMap,
    };
}
