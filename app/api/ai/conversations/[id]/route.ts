/**
 * app/api/ai/conversations/[id]/route.ts
 *
 * GET    → fetch a single conversation with its full message list
 * DELETE → remove a conversation
 */

import { NextResponse } from "next/server";
import { authenticate, isAuthError } from "@/lib/ai/auth";
import { deleteConversation, getConversation } from "@/lib/ai/chats";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
    const authResult = await authenticate(req);
    if (isAuthError(authResult)) return authResult.error;

    const { id } = await ctx.params;
    try {
        const conversation = await getConversation(authResult.uid, id);
        if (!conversation) {
            return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
        }
        return NextResponse.json({ conversation });
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Failed to load conversation" },
            { status: 500 },
        );
    }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
    const authResult = await authenticate(req);
    if (isAuthError(authResult)) return authResult.error;

    const { id } = await ctx.params;
    try {
        await deleteConversation(authResult.uid, id);
        return NextResponse.json({ message: "Conversation deleted." });
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Failed to delete conversation" },
            { status: 500 },
        );
    }
}
