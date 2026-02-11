// app/api/lms/proxy/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db, auth } from "@/lib/firebaseAdmin";
import { redirect } from "next/navigation";

const LMS_API_ENDPOINT = "/sync";

export async function handler(req: NextRequest) {
    let redirectUrl = "";
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer "))
            return NextResponse.json({ error: "Missing or invalid auth header" }, { status: 401 });

        const idToken = authHeader.split(" ")[1];
        const decodedToken = await auth.verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const userRef = db.collection("users").doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) throw new Error("User not found");

        const userData: any = userDoc.data();

        if (!userData.lms) throw new Error("No LMS linked to user");

        redirectUrl = `/api/${userData.lms}${LMS_API_ENDPOINT}`;
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
    redirect(redirectUrl);
}

// Export all HTTP methods to handle generically
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const OPTIONS = handler;
