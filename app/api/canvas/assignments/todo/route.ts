import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { getDueLMSAssignments } from "@/lib/firebaseSchema";

import { getUid } from "@/lib/access/auth";
export async function GET(req: Request) {
    try {
        const uid = getUid(req);

        // Fetch assignments from new collection structure
        const assignments = await getDueLMSAssignments(uid);

        return NextResponse.json({ status: "ok", assignments });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
