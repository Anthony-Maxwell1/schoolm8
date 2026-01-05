// app/api/canvas/sync/route.ts
import { NextResponse } from "next/server";
import { db, auth } from "@/lib/firebaseAdmin";
import { htmlToText } from "html-to-text";

type CanvasCourse = {
    id: number;
    name: string;
    html_url: string;
};

type CanvasAssignment = {
    id: number;
    name: string;
    description: string;
    due_at: string | null;
    html_url: string;
};

type CanvasSubmission = {
    submitted_at: string | null;
    workflow_state: string; // unsubmitted | submitted | graded | etc.
};

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

function sanitizeHTML(input: string): string {
    return htmlToText(input, {}).trim();
}

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer "))
            return NextResponse.json(
                { error: "Missing or invalid Authorization header" },
                { status: 401 },
            );

        const idToken = authHeader.split(" ")[1];

        // Verify Firebase ID token
        const decodedToken = await auth.verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const assignments = await syncCanvasForUser(userId);
        return NextResponse.json({ status: "ok", assignments });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

async function syncCanvasForUser(userId: string) {
    const userRef = db.collection("users").doc(userId);
    const doc = await userRef.get();
    if (!doc.exists) throw new Error("User not found");

    const userData = doc.data();
    const canvasToken = userData?.canvasToken;
    const canvasBaseUrl = userData?.info?.canvasBaseUrl;
    if (!canvasToken || !canvasBaseUrl) throw new Error("Missing Canvas token or base URL");

    const fetchJson = (url: string) =>
        fetch(url, { headers: { Authorization: `Bearer ${canvasToken}` } }).then((r) =>
            r.ok ? r.json() : null,
        );

    const courses: CanvasCourse[] = (await fetchJson(`${canvasBaseUrl}/api/v1/courses`)) || [];
    const existingAssignments: Record<string, any> = userData?.data?.assignments || {};
    const updatedAssignments: Record<string, any> = {};
    const seenIds = new Set<string>();

    for (const course of courses) {
        const assignments: CanvasAssignment[] =
            (await fetchJson(`${canvasBaseUrl}/api/v1/courses/${course.id}/assignments`)) || [];

        for (const a of assignments) {
            const id = a.id.toString();
            seenIds.add(id);

            const existing = existingAssignments[id];
            const overriddenKeys: string[] = existing?.overriddenFields || [];

            const submission: CanvasSubmission | null = await fetchJson(
                `${canvasBaseUrl}/api/v1/courses/${course.id}/assignments/${a.id}/submissions/self`,
            );

            const status = submission?.workflow_state || "unsubmitted";

            let assignment: any = {
                id,
                title: a.name,
                description: sanitizeHTML(a.description),
                courseId: course.id.toString(),
                courseName: course.name,
                dueAt: a.due_at ? new Date(a.due_at).toISOString() : null,
                url: a.html_url,
                submissionState: status,
                submittedAt: submission?.submitted_at || null,
                projects: existing?.projects || [],
                missing: false,
                rawCanvasData: a,
                updatedAt: new Date().toISOString(),
                createdAt: existing?.createdAt || new Date().toISOString(),
                overriddenFields: overriddenKeys,
            };

            for (const key of overriddenKeys) {
                if (existing && key in existing) assignment[key] = existing[key];
            }

            updatedAssignments[id] = assignment;
        }
    }

    for (const id of Object.keys(existingAssignments)) {
        if (!seenIds.has(id)) {
            updatedAssignments[id] = {
                ...existingAssignments[id],
                missing: true,
                updatedAt: new Date().toISOString(),
            };
        }
    }

    const coursesMap: Record<string, any> = {};
    for (const c of courses) {
        coursesMap[c.id.toString()] = {
            id: c.id.toString(),
            name: c.name,
            url: canvasBaseUrl + "/" + c.id.toString(),
            updatedAt: new Date().toISOString(),
        };
    }

    await userRef.set(
        {
            data: {
                assignments: cleanUndefined(updatedAssignments),
                courses: cleanUndefined(coursesMap),
            },
        },
        { merge: true },
    );

    return updatedAssignments;
}
