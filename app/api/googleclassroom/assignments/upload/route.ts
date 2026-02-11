// /pages/api/classroom/attach-submit.ts
import { NextApiRequest, NextApiResponse } from "next";
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") return res.status(405).end();

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer "))
            return res.status(401).json({ error: "Missing Authorization" });

        const idToken = authHeader.split(" ")[1];
        const decodedToken = await auth.verifyIdToken(idToken);
        const userId = decodedToken.uid;

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

        const { courseId, assignmentId, name, contentType, contentBase64 } = req.body;
        if (!courseId || !assignmentId || !name || !contentType || !contentBase64)
            return res.status(400).json({ error: "Missing fields" });

        // Save temp file
        const tempPath = path.join("/tmp", name);
        fs.writeFileSync(tempPath, Buffer.from(contentBase64, "base64"));

        // Upload to Drive
        const fileId = await uploadFileToDrive(oAuth2Client, tempPath, name, contentType);

        // Get submission ID
        const submissionId = await getStudentSubmissionId(oAuth2Client, courseId, assignmentId);

        if (!submissionId || !fileId)
            return res.status(404).json({ error: "Submission or file not found" });

        // Attach file
        await attachFileToAssignment(oAuth2Client, courseId, assignmentId, submissionId, fileId);

        // Submit assignment
        await submitAssignment(oAuth2Client, courseId, assignmentId, submissionId);

        // Cleanup
        fs.unlinkSync(tempPath);

        res.status(200).json({
            message: "Assignment attached and submitted",
            submissionId,
            fileId,
        });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}
