/**
 * app/api/ai/conversations/route.ts
 *
 * GET → list the signed-in user's tutor conversations (most recent first).
 */

import { NextResponse } from "next/server";
import { authenticate, isAuthError } from "@/lib/ai/auth";
import { listConversations } from "@/lib/ai/chats";

export const runtime = "nodejs";

export async function GET(req: Request) {
    const authResult = await authenticate(req);
    if (isAuthError(authResult)) return authResult.error;

    try {
        const conversations = await listConversations(authResult.uid);
        return NextResponse.json({ conversations });
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Failed to list conversations" },
            { status: 500 },
        );
    }
}
