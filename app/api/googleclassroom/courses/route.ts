import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { getLMSCourses } from "@/lib/firebaseSchema";

import { getUid } from "@/lib/access/auth";
export async function GET(req: Request) {
    try {
        const uid = getUid(req);

        // Fetch courses from new collection structure
        const courses = await getLMSCourses(uid);

        return NextResponse.json({ status: "ok", courses });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
