import { NextResponse } from "next/server";
import { auth } from "@/lib/firebaseAdmin";
import { assertAccess } from "@/lib/access/serverAccessControl";
import { getKnowledgeBase } from "@/lib/firebaseSchema";

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

        const accessResult = await assertAccess(uid, [
            "api/knowledge/*",
            "apiAccessLevel1",
            "UGCAccessPermitted",
        ]);

        if (accessResult.status !== 200) {
            return new Response(JSON.stringify({ error: accessResult.body!.error }), {
                status: accessResult.status,
            });
        }
        const knowledgeBase = await getKnowledgeBase(uid);
        return NextResponse.json({ data: knowledgeBase });
    } catch (error) {
        console.error("Error in GET /api/knowledge/get:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}
