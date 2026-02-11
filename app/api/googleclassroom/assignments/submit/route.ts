// /pages/api/classroom/submit.ts
import { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";
import { db, auth } from "@/lib/firebaseAdmin";
import { getStudentSubmissionId, submitAssignment } from "@/lib/googleClassroom";

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

        const { courseId, assignmentId } = req.body;
        if (!courseId || !assignmentId) return res.status(400).json({ error: "Missing fields" });

        // Get submission ID
        const submissionId = await getStudentSubmissionId(oAuth2Client, courseId, assignmentId);

        if (!submissionId) return res.status(404).json({ error: "Submission not found" });

        // Submit assignment
        await submitAssignment(oAuth2Client, courseId, assignmentId, submissionId);

        res.status(200).json({ message: "Assignment submitted", submissionId });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}
