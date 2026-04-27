// api/auth/onedrive/status/route.ts
import { NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import { assertAccess } from "@/lib/access/ServerAccessControl";

export async function GET(req: Request) {
    try {
        // ---------- AUTH CHECK ----------
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
        }

        const idToken = authHeader.split(" ")[1];
        const decoded = await auth.verifyIdToken(idToken);
        const uid = decoded.uid;

        const accessResult = await assertAccess(uid, ["api/auth/onedrive/*", "apiAccessLevel1"]);

        if (accessResult.status !== 200) {
            return new Response(JSON.stringify({ error: accessResult.body!.error }), {
                status: accessResult.status,
            });
        }

        const doc = await db.collection("users").doc(uid).get();
        const hasOneDrive = !!doc.data()?.onedrive?.token;

        return NextResponse.json({ authenticated: hasOneDrive });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
