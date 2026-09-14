// app/api/lms/proxy/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { redirect } from "next/navigation";

import { getUid } from "@/lib/access/auth";
const LMS_API_ENDPOINT = "/status";

export async function GET(req: NextRequest) {
    try {
        const userId = getUid(req);

        const userRef = db.collection("users").doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) throw new Error("User not found");

        const userData: any = userDoc.data();

        if (!userData.lms) return NextResponse.json({ lms: null }, { status: 404 });
        return NextResponse.json({ lms: userData.lms });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
