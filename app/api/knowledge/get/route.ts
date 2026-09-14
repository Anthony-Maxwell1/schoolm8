import { NextResponse } from "next/server";

import { getKnowledgeBase } from "@/lib/firebaseSchema";

import { getUid } from "@/lib/access/auth";
export async function GET(req: Request) {
    try {
        const uid = getUid(req);
        const knowledgeBase = await getKnowledgeBase(uid);
        return NextResponse.json({ data: knowledgeBase });
    } catch (error) {
        console.error("Error in GET /api/knowledge/get:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}
