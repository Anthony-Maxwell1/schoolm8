import { NextResponse } from "next/server";
import { db, auth } from "@/lib/firebaseAdmin";
import { getLMSAssignments } from "@/lib/firebaseSchema";
import { assertAccess } from "@/lib/access/ServerAccessControl";

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer "))
            return NextResponse.json(
                { error: "Missing or invalid Authorization header" },
                { status: 401 },
            );

        const idToken = authHeader.split(" ")[1];

        // Verify Firebase ID token
        const decodedToken = await auth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        const accessResult = await assertAccess(uid, ["api/googleclassroom/*", "apiAccessLevel1"]);

        if (accessResult.status !== 200) {
            return new Response(JSON.stringify({ error: accessResult.body!.error }), {
                status: accessResult.status,
            });
        }

        // Fetch assignments from new collection structure
        const assignments = await getLMSAssignments(uid);

        return NextResponse.json({ status: "ok", assignments });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
