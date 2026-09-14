import { NextResponse } from "next/server";

import { saveKnowledgeBase } from "@/lib/firebaseSchema";
import { getUid } from "@/lib/access/auth";
export async function POST(req: Request) {
    try {
        const uid = getUid(req);
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
