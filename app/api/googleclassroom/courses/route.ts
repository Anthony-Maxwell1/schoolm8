import { NextResponse } from "next/server";
import { db, auth } from "@/lib/firebaseAdmin";
import { getLMSCourses } from "@/lib/firebaseSchema";

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
        const uid = decodedToken.uid;

        // Fetch courses from new collection structure
        const courses = await getLMSCourses(uid);

        return NextResponse.json({ status: "ok", courses });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
