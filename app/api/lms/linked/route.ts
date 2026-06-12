// app/api/lms/proxy/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db, auth } from "@/lib/firebaseAdmin";
import { redirect } from "next/navigation";
import { assertAccess } from "@/lib/access/serverAccessControl";

const LMS_API_ENDPOINT = "/status";

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer "))
            return NextResponse.json({ error: "Missing or invalid auth header" }, { status: 401 });

        const idToken = authHeader.split(" ")[1];
        const decodedToken = await auth.verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const accessResult = await assertAccess(userId, ["api/lms/*", "apiAccessLevel0"]);

        if (accessResult.status !== 200) {
            return new Response(JSON.stringify({ error: accessResult.body!.error }), {
                status: accessResult.status,
            });
        }

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
