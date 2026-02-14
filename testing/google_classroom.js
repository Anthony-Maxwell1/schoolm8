import path from "node:path";
import process from "node:process";
import { authenticate } from "@google-cloud/local-auth";
import { google } from "googleapis";

// The scope for reading Classroom courses.
const SCOPES = ["https://www.googleapis.com/auth/classroom.courses.readonly"];
// The path to the credentials file downloaded from the Cloud Console.
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

/**
 * Lists the first 10 courses the user has access to.
 */
async function listCourses() {
    const auth = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
    });
    const classroom = google.classroom({ version: "v1", auth });
    const res = await classroom.courses.list({
        pageSize: 10,
    });
    const courses = res.data.courses;
    if (courses && courses.length) {
        console.log("Courses:");
        courses.forEach((course) => {
            console.log(`${course.name} (${course.id})`);
        });
    } else {
        console.log("No courses found.");
    }
}

listCourses().catch(console.error);
