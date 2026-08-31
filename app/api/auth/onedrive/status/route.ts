// api/auth/onedrive/status/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

import { getUid } from "@/lib/access/auth";
export async function GET(req: Request) {
    try {
        // ---------- AUTH CHECK ----------
        const uid = getUid(req);

        const doc = await db.collection("users").doc(uid).get();
        const hasOneDrive = !!doc.data()?.onedrive?.token;

        return NextResponse.json({ authenticated: hasOneDrive });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
