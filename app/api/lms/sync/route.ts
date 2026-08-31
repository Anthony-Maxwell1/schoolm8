// app/api/lms/proxy/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

import { getUid } from "@/lib/access/auth";
const LMS_API_ENDPOINT = "/sync";

export async function handler(req: NextRequest) {
    let redirectUrl = "";
    const userId = getUid(req);
    try {
        const userRef = db.collection("users").doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) throw new Error("User not found");

        const userData: any = userDoc.data();
        console.log(userData);

        if (!userData.lms) throw new Error("No LMS linked to user");

        redirectUrl = `/api/${userData.lms}${LMS_API_ENDPOINT}${new URL(req.url).search}`;
    } catch (err: any) {
        const executionId = req.nextUrl.searchParams.get("taskId");
        if (executionId) {
            try {
                const userRef = db.collection("users").doc(userId);
                await userRef.update({
                    [`executions.${executionId}.status`]: "failed",
                });
            } catch (updateErr) {
                console.error("Failed to update task status:", updateErr);
            }
        }

        return NextResponse.json({ error: err.message }, { status: 500 });
    }
    const absoluteUrl = new URL(redirectUrl, req.url).toString(); // convert to absolute
    return NextResponse.redirect(absoluteUrl, 302);
}

// Export all HTTP methods to handle generically
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const OPTIONS = handler;
