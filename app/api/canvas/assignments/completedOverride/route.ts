import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { markCompletedOverride } from "@/lib/firebaseSchema";

import { getUid } from "@/lib/access/auth";
export async function GET(req: Request) {
    try {
        const uid = getUid(req);

        const { assignment, completed } = await req.json();
        if (!assignment || typeof completed !== "boolean") {
            return NextResponse.json(
                { error: "Missing or invalid assignment or completed status" },
                { status: 400 },
            );
        }

        // Fetch assignments from new collection structure
        const assignments = await markCompletedOverride(uid, assignment, completed);

        return NextResponse.json({ status: "ok", assignments });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
