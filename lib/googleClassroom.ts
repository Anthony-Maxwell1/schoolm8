// /lib/classroom.ts
import { google } from "googleapis";
import fs from "fs";
import path from "path";

// ---------- 1️⃣ Upload a file to Google Drive ----------
export async function uploadFileToDrive(
    studentOAuthClient: any,
    filePath: string,
    fileName: string,
    mimeType: string,
) {
    const drive = google.drive({ version: "v3", auth: studentOAuthClient });

    const media = {
        mimeType,
        body: fs.createReadStream(filePath),
    };

    const fileMetadata = {
        name: fileName,
    };

    const file = await drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: "id",
    });

    return file.data.id; // return the uploaded Drive file ID
}

// ---------- 2️⃣ Attach file to a Classroom assignment ----------
export async function attachFileToAssignment(
    studentOAuthClient: any,
    courseId: string,
    courseWorkId: string,
    submissionId: string,
    fileId: string,
) {
    const classroom = google.classroom({ version: "v1", auth: studentOAuthClient });

    const res = await classroom.courses.courseWork.studentSubmissions.patch({
        courseId,
        courseWorkId,
        id: submissionId,
        updateMask: "assignmentSubmission",
        requestBody: {
            assignmentSubmission: {
                attachments: [
                    {
                        driveFile: { id: fileId },
                    },
                ],
            },
        },
    });

    return res.data;
}

// ---------- 3️⃣ Submit the assignment ----------
export async function submitAssignment(
    studentOAuthClient: any,
    courseId: string,
    courseWorkId: string,
    submissionId: string,
) {
    const classroom = google.classroom({ version: "v1", auth: studentOAuthClient });

    const res = await classroom.courses.courseWork.studentSubmissions.patch({
        courseId,
        courseWorkId,
        id: submissionId,
        updateMask: "state",
        requestBody: {
            state: "TURNED_IN",
        },
    });

    return res.data;
}

// ---------- Helper: Get the student's submission ----------
export async function getStudentSubmissionId(
    studentOAuthClient: any,
    courseId: string,
    courseWorkId: string,
) {
    const classroom = google.classroom({ version: "v1", auth: studentOAuthClient });

    const res = await classroom.courses.courseWork.studentSubmissions.list({
        courseId,
        courseWorkId,
        userId: "me",
    });

    if (!res.data.studentSubmissions || res.data.studentSubmissions.length === 0) {
        throw new Error("No submission found for this student");
    }

    return res.data.studentSubmissions[0].id;
}
