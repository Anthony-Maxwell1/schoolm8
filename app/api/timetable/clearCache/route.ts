import { assertAccess } from "@/lib/access/serverAccessControl";
import { auth, db } from "@/lib/firebaseAdmin";
import { deleteTimetableCache } from "@/lib/firebaseSchema";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer "))
        return NextResponse.json(
            { error: "Missing or invalid Authorization header" },
            { status: 401 },
        );

    const idToken = authHeader.split(" ")[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;
    const result_ = await assertAccess(userId, ["api/timetable/*", "apiAccessLevel0"]);

    if (result_.status !== 200) {
        return new Response(JSON.stringify({ error: result_.body!.error }), {
            status: result_.status,
        });
    }
    await deleteTimetableCache(userId);
    return NextResponse.json({ message: "Timetable cache cleared" });
}
