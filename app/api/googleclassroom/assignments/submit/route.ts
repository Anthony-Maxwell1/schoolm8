// /pages/api/classroom/submit.ts
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { db } from "@/lib/firebaseAdmin";
import { getStudentSubmissionId, submitAssignment } from "@/lib/googleClassroom";
import { getUid } from "@/lib/access/auth";

export async function POST(req: Request) {
    try {
        const userId = getUid(req);

        const userDoc = await db.collection("users").doc(userId).get();
        if (!userDoc.exists) throw new Error("User not found");

        const tokenData = userDoc.data()?.google?.classroom?.token;
        if (!tokenData?.access_token || !tokenData?.refresh_token)
            throw new Error("Missing Google Classroom tokens");

        // OAuth client
        const oAuth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
        );
        oAuth2Client.setCredentials(tokenData);

        const { courseId, assignmentId } = await req.json();
        if (!courseId || !assignmentId)
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });

        // Get submission ID
        const submissionId = await getStudentSubmissionId(oAuth2Client, courseId, assignmentId);

        if (!submissionId)
            return NextResponse.json({ error: "Submission not found" }, { status: 404 });

        // Submit assignment
        await submitAssignment(oAuth2Client, courseId, assignmentId, submissionId);

        return NextResponse.json({ message: "Assignment submitted", submissionId }, { status: 200 });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
