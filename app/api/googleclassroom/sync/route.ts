// app/api/classroom/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import { google, classroom_v1 } from "googleapis";
import { htmlToText } from "html-to-text";

/* =========================
   Types
========================= */

export type ClassroomCourse = {
    id: string;
    name: string;
    url: string;
};

export type ClassroomAssignment = {
    id: string;
    title: string;
    description: string;
    courseId: string;
    courseName: string;
    dueAt: string | null;
    url: string;

    submissionState: string;
    submittedAt: string | null;

    projects: any[];
    missing: boolean;

    rawClassroomData: classroom_v1.Schema$CourseWork;

    updatedAt: string;
    createdAt: string;

    overriddenFields: string[];
};

export type ClassroomAnnouncement = {
    id: string;
    text: string;
    courseId: string;
    courseName: string;
    state: string;
    createdAt: string;
    updatedAt: string;
};

export type ClassroomSyncResult = {
    assignments: Record<string, ClassroomAssignment>;
    announcements: Record<string, ClassroomAnnouncement>;
    courses: Record<string, ClassroomCourse>;
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
    return htmlToText(input || "", {}).trim();
}

/* =========================
   Route
========================= */

export async function GET(req: NextRequest) {
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

        const { assignments, announcements, courses } = await syncClassroomForUser(userId);

        const executionId = req.nextUrl.searchParams.get("taskId");
        if (executionId) {
            try {
                const userRef = db.collection("users").doc(userId);
                await userRef.update({
                    [`executions.${executionId}.status`]: "complete",
                });
            } catch (updateErr) {
                console.error("Failed to update task status:", updateErr);
            }
        }

        return NextResponse.json({
            status: "ok",
            assignments,
            announcements,
            courses,
        });
    } catch (err: any) {
        console.error("CLASSROOM SYNC ERROR FULL:", err);

        const executionId = req.nextUrl.searchParams.get("taskId");
        if (executionId) {
            try {
                const authHeader = req.headers.get("Authorization")!;

                const idToken = authHeader.split(" ")[1];
                const decodedToken = await auth.verifyIdToken(idToken);
                const userId = decodedToken.uid;
                const userRef = db.collection("users").doc(userId);
                await userRef.update({
                    [`executions.${executionId}.status`]: "failed",
                });
            } catch (updateErr) {
                console.error("Failed to update task status:", updateErr);
            }
        }

        return NextResponse.json(
            {
                message: err.message,
                code: err.code,
                status: err?.response?.status,
                data: err?.response?.data,
                errors: err?.errors,
            },
            { status: 500 },
        );
    }
}

/* =========================
   Core Sync
========================= */

async function syncClassroomForUser(userId: string): Promise<ClassroomSyncResult> {
    const userRef = db.collection("users").doc(userId);
    const doc = await userRef.get();
    if (!doc.exists) throw new Error("User not found");

    const userData = doc.data();
    const tokenData = userData?.google?.classroom?.token;

    if (!tokenData?.access_token || !tokenData?.refresh_token) {
        throw new Error("Missing Google Classroom tokens");
    }

    const oAuth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
    );

    oAuth2Client.setCredentials({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expiry_date: tokenData.expiry_date,
        token_type: tokenData.token_type,
    });

    const classroom = google.classroom({
        version: "v1",
        auth: oAuth2Client,
    });

    /* =========================
       Fetch Courses
    ========================= */

    const coursesRes = await classroom.courses.list();
    const courses = coursesRes.data.courses || [];

    const coursesMap: Record<string, ClassroomCourse> = {};
    for (const c of courses) {
        if (!c.id) continue;
        coursesMap[c.id] = {
            id: c.id,
            name: c.name || "",
            url: c.alternateLink || "",
        };
    }

    /* =========================
       Prepare
    ========================= */

    const existingAssignments: Record<string, ClassroomAssignment> =
        userData?.data?.assignments || {};

    const updatedAssignments: Record<string, ClassroomAssignment> = {};
    const updatedAnnouncements: Record<string, ClassroomAnnouncement> = {};

    const seenIds = new Set<string>();

    /* =========================
       Loop Courses
    ========================= */

    for (const course of courses) {
        if (!course.id) continue;

        /* ---------- Assignments ---------- */

        const assignmentsRes = await classroom.courses.courseWork.list({
            courseId: course.id,
        });

        const courseWork = assignmentsRes.data.courseWork || [];

        for (const a of courseWork) {
            if (!a.id) continue;

            const id = a.id;
            seenIds.add(id);

            const existing = existingAssignments[id];
            const overriddenKeys: string[] = existing?.overriddenFields || [];

            /* ---- Submission ---- */

            const submissionsRes = await classroom.courses.courseWork.studentSubmissions.list({
                courseId: course.id,
                courseWorkId: a.id,
                userId: "me",
            });

            const submission = submissionsRes.data.studentSubmissions?.[0];

            let submittedAt: string | null = null;

            if (submission?.updateTime) {
                submittedAt = new Date(submission.updateTime).toISOString();
            }

            /* ---- Assignment ---- */

            const assignment: ClassroomAssignment = {
                id,
                title: a.title || "",
                description: a.description ? sanitizeHTML(a.description) : "",
                courseId: course.id,
                courseName: course.name || "",
                dueAt: a.dueDate
                    ? new Date(
                          a.dueDate.year!,
                          (a.dueDate.month || 1) - 1,
                          a.dueDate.day!,
                          a.dueTime?.hours || 0,
                          a.dueTime?.minutes || 0,
                      ).toISOString()
                    : null,
                url: a.alternateLink || "",

                submissionState: submission?.state || "NEW",
                submittedAt,

                projects: existing?.projects || [],
                missing: false,

                rawClassroomData: a,

                updatedAt: new Date().toISOString(),
                createdAt: existing?.createdAt || new Date().toISOString(),

                overriddenFields: overriddenKeys,
            };

            for (const key of overriddenKeys) {
                if (existing && key in existing) {
                    // @ts-ignore
                    assignment[key] = existing[key];
                }
            }

            updatedAssignments[id] = assignment;
        }

        /* ---------- Announcements ---------- */

        const announcementsRes = await classroom.courses.announcements.list({
            courseId: course.id,
        });

        const announcements = announcementsRes.data.announcements || [];

        for (const ann of announcements) {
            if (!ann.id) continue;

            updatedAnnouncements[ann.id] = {
                id: ann.id,
                text: ann.text ? sanitizeHTML(ann.text) : "",
                courseId: course.id,
                courseName: course.name || "",
                state: ann.state || "UNKNOWN",
                createdAt: ann.creationTime
                    ? new Date(ann.creationTime).toISOString()
                    : new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
        }
    }

    /* =========================
       Missing Assignments
    ========================= */

    for (const id of Object.keys(existingAssignments)) {
        if (!seenIds.has(id)) {
            updatedAssignments[id] = {
                ...existingAssignments[id],
                missing: true,
                updatedAt: new Date().toISOString(),
            };
        }
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

    oAuth2Client.setCredentials({});

    return {
        assignments: updatedAssignments,
        announcements: updatedAnnouncements,
        courses: coursesMap,
    };
}
