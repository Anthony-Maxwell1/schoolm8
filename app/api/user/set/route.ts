import { db } from "@/lib/firebaseAdmin";
import { NextRequest, NextResponse } from "next/server";

import { getUid } from "@/lib/access/auth";
export async function POST(req: NextRequest) {
    const authedUserId = getUid(req);

    try {
        const body = await req.json();
        await db.collection("users").doc(authedUserId).set(
            {
                userData: body,
            },
            { merge: true },
        );
        return NextResponse.json({ status: "ok" });
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
}
