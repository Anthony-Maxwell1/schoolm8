// /pages/api/classroom/attach-submit.ts
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { google } from "googleapis";
import {
    attachFileToAssignment,
    uploadFileToDrive,
    submitAssignment,
    getStudentSubmissionId,
} from "@/lib/googleClassroom";
import { db, auth } from "@/lib/firebaseAdmin";
import { assertAccess } from "@/lib/access/serverAccessControl";

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer "))
            return NextResponse.json({ error: "Missing Authorization" }, { status: 401 });

        const idToken = authHeader.split(" ")[1];
        const decodedToken = await auth.verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const accessResult = await assertAccess(userId, [
            "api/googleclassroom/*",
            "apiAccessLevel1",
        ]);

        if (accessResult.status !== 200) {
            return NextResponse.json({ error: accessResult.body!.error }, { status: accessResult.status });
        }

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

        const { courseId, assignmentId, name, contentType, contentBase64 } = await req.json();
        if (!courseId || !assignmentId || !name || !contentType || !contentBase64)
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });

        // Save temp file
        const tempPath = path.join("/tmp", name);
        fs.writeFileSync(tempPath, Buffer.from(contentBase64, "base64"));

        // Upload to Drive
        const fileId = await uploadFileToDrive(oAuth2Client, tempPath, name, contentType);

        // Get submission ID
        const submissionId = await getStudentSubmissionId(oAuth2Client, courseId, assignmentId);

        if (!submissionId || !fileId)
            return NextResponse.json({ error: "Submission or file not found" }, { status: 404 });

        // Attach file
        await attachFileToAssignment(oAuth2Client, courseId, assignmentId, submissionId, fileId);

        // Submit assignment
        await submitAssignment(oAuth2Client, courseId, assignmentId, submissionId);

        // Cleanup
        fs.unlinkSync(tempPath);

        return NextResponse.json(
            {
                message: "Assignment attached and submitted",
                submissionId,
                fileId,
            },
            { status: 200 },
        );
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
