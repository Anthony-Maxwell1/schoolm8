// app/api/classroom/sync/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { google, classroom_v1 } from "googleapis";
import { htmlToText } from "html-to-text";

type ClassroomCourse = {
  id: string;
  name: string;
  url: string;
};

type ClassroomAssignment = {
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
  rawClassroomData: any;
  updatedAt: string;
  createdAt: string;
  overriddenFields: string[];
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

function sanitizeHTML(input: string | undefined): string {
  return htmlToText(input || "", {}).trim();
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer "))
      return NextResponse.json(
        { error: "Missing or invalid Authorization header" },
        { status: 401 }
      );

    const idToken = authHeader.split(" ")[1];

    // Import Firebase auth lazily to avoid circular imports
    const { auth } = await import("@/lib/firebaseAdmin");
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const assignments = await syncClassroomForUser(userId);
    return NextResponse.json({ status: "ok", assignments });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function syncClassroomForUser(userId: string) {
  const userRef = db.collection("users").doc(userId);
  const doc = await userRef.get();
  if (!doc.exists) throw new Error("User not found");

  const userData = doc.data();
  const tokenData = userData?.google?.classroom?.token;
  if (!tokenData?.accessToken || !tokenData?.refreshToken)
    throw new Error("Missing Google Classroom tokens");

  // Initialize OAuth2 client
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oAuth2Client.setCredentials({
    access_token: tokenData.accessToken,
    refresh_token: tokenData.refreshToken,
  });

  const classroom = google.classroom({ version: "v1", auth: oAuth2Client });

  // Fetch courses
  const coursesRes = await classroom.courses.list();
  const courses: classroom_v1.Schema$Course[] = coursesRes.data.courses || [];

  const existingAssignments: Record<string, ClassroomAssignment> =
    userData?.data?.assignments || {};
  const updatedAssignments: Record<string, ClassroomAssignment> = {};
  const seenIds = new Set<string>();

  for (const course of courses) {
    if (!course.id) continue;

    // Fetch course work (assignments)
    const assignmentsRes = await classroom.courses.courseWork.list({
      courseId: course.id,
    });
    const courseWork: classroom_v1.Schema$CourseWork[] = assignmentsRes.data.courseWork || [];

    for (const a of courseWork) {
      if (!a.id) continue;

      const id = a.id;
      seenIds.add(id);

      const existing = existingAssignments[id];
      const overriddenKeys: string[] = existing?.overriddenFields || [];

      // Fetch student submissions for this assignment
      const submissionsRes = await classroom.courses.courseWork.studentSubmissions.list({
        courseId: course.id,
        courseWorkId: a.id,
        userId,
      });
      const submission = submissionsRes.data.studentSubmissions?.[0];

      let submittedAt: string | null = null;

      if (submission?.submissionHistory?.length) {
        const firstHistory = submission.submissionHistory[0]; // Schema$SubmissionHistory
        if (firstHistory.stateHistory?.stateTimestamp) {
          submittedAt = new Date(firstHistory.stateHistory.stateTimestamp).toISOString();
        }
      }



      const assignment: ClassroomAssignment = {
        id,
        title: a.title || "",
        description: sanitizeHTML(a.description ?? ""),
        courseId: course.id,
        courseName: course.name || "",
        dueAt: a.dueDate
          ? new Date(
              a.dueDate.year!,
              (a.dueDate.month || 1) - 1,
              a.dueDate.day!,
              a.dueTime?.hours || 0,
              a.dueTime?.minutes || 0
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

      // Apply overridden fields
      for (const key of overriddenKeys) {
        if (existing && key in existing) {
          // @ts-ignore Safe because we trust overriddenKeys
          assignment[key] = existing[key];
        }
      }

      updatedAssignments[id] = assignment;
    }
  }

  // Mark missing assignments
  for (const id of Object.keys(existingAssignments)) {
    if (!seenIds.has(id)) {
      updatedAssignments[id] = {
        ...existingAssignments[id],
        missing: true,
        updatedAt: new Date().toISOString(),
      };
    }
  }

  // Build courses map
  const coursesMap: Record<string, ClassroomCourse> = {};
  for (const c of courses) {
    if (!c.id) continue;
    coursesMap[c.id] = {
      id: c.id,
      name: c.name || "",
      url: c.alternateLink || "",
    };
  }

  // Save back to Firebase
  await userRef.set(
    {
      data: {
        assignments: cleanUndefined(updatedAssignments),
        courses: cleanUndefined(coursesMap),
      },
    },
    { merge: true }
  );

  // Clear credentials from memory
  oAuth2Client.setCredentials({});

  return updatedAssignments;
}
