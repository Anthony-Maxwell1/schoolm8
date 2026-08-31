// app/api/lms/proxy/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { redirect } from "next/navigation";

import { getUid } from "@/lib/access/auth";
const LMS_API_ENDPOINT = "/assignments/todo";

export async function handler(req: NextRequest) {
    try {
        const userId = getUid(req);

        const userRef = db.collection("users").doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) throw new Error("User not found");

        const userData: any = userDoc.data();

        if (!userData.lms) throw new Error("No LMS linked to user");

        const redirectUrl = `/api/${userData.lms}${LMS_API_ENDPOINT}${new URL(req.url).search}`;

        const absoluteUrl = new URL(redirectUrl, req.url).toString(); // convert to absolute
        return NextResponse.redirect(absoluteUrl, 302);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// Export all HTTP methods to handle generically
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const OPTIONS = handler;
