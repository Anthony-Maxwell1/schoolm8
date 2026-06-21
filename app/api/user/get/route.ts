import { assertAccess } from "@/lib/access/serverAccessControl";
import { auth, db } from "@/lib/firebaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
    }

    const idToken = authHeader.split(" ")[1];

    // Verify Firebase token
    const decoded = await auth.verifyIdToken(idToken);
    const authedUserId = decoded.uid;

    const accessResult = await assertAccess(authedUserId, ["api/user/*", "apiAccessLevel0"]);

    if (accessResult.status !== 200) {
        return new Response(JSON.stringify({ error: accessResult.body!.error }), {
            status: accessResult.status,
        });
    }

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
