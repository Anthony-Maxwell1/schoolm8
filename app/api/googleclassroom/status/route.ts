import { NextResponse } from "next/server";
import { auth } from "@/lib/firebaseAdmin";
import { assertAccess } from "@/lib/access/serverAccessControl";

export async function GET(req: Request) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
    }

    const idToken = authHeader.split(" ")[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const accessResult = await assertAccess(userId, ["api/googleclassroom/*", "apiAccessLevel1"]);
    if (accessResult.status !== 200) {
        return new Response(JSON.stringify({ error: accessResult.body!.error }), {
            status: accessResult.status,
        });
    }

    return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
