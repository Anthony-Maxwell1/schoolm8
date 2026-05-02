import { NextResponse } from "next/server";
import { auth } from "@/lib/firebaseAdmin";
import { assertAccess } from "@/lib/access/serverAccessControl";
import { saveKnowledgeBase } from "@/lib/firebaseSchema";
export async function POST(req: Request) {
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
        const { content } = await req.json();
        if (!content) {
            return NextResponse.json({ error: "Missing content in request body" }, { status: 400 });
        }
        await saveKnowledgeBase(uid, content); // Replace with actual knowledge base data
        return NextResponse.json({ message: "Knowledge base content set successfully" });
    } catch (error) {
        console.error("Error in POST /api/knowledge/set:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}
