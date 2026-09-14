import { db } from "@/lib/firebaseAdmin";
import { NextRequest, NextResponse } from "next/server";

import { getUid } from "@/lib/access/auth";
export async function GET(req: NextRequest) {
    const authedUserId = getUid(req);

    try {
        const doc = await db.collection("users").doc(authedUserId).get();
        if (!doc.exists) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        const userData = doc.get("userData") || {};
        return NextResponse.json({ status: "ok", userData });
    } catch {
        return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 });
    }
}
