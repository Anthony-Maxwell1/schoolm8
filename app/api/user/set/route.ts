import { assertAccess } from "@/lib/access/serverAccessControl";
import { auth, db } from "@/lib/firebaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
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
