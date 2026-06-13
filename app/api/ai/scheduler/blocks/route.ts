/**
 * app/api/ai/scheduler/blocks/route.ts
 *
 * GET    → list saved study-plan blocks
 * POST   → save accepted blocks (the user reviewed/edited the AI plan)
 * DELETE → clear all saved blocks
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticate, isAuthError } from "@/lib/ai/auth";
import { clearBlocks, listBlocks, saveBlocks, type SavedBlock } from "@/lib/ai/planner";

export const runtime = "nodejs";

const blockSchema = z.object({
    id: z.string().min(1),
    taskId: z.string().min(1),
    title: z.string().min(1),
    start: z.string(),
    end: z.string(),
    priority: z.number().int().min(1).max(5),
    sessionIndex: z.number().int().min(1),
    sessionCount: z.number().int().min(1),
    reasoning: z.string().optional(),
    suggestedDueDate: z.string().nullable().optional(),
    matchedAssignmentId: z.string().nullable().optional(),
    createdAt: z.string().optional(),
});

const postSchema = z.object({ blocks: z.array(blockSchema).max(300) });

export async function GET(req: Request) {
    const authResult = await authenticate(req);
    if (isAuthError(authResult)) return authResult.error;
    try {
        const blocks = await listBlocks(authResult.uid);
        return NextResponse.json({ blocks });
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Failed to load blocks" },
            { status: 500 },
        );
    }
}

export async function POST(req: Request) {
    const authResult = await authenticate(req);
    if (isAuthError(authResult)) return authResult.error;

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.issues[0]?.message ?? "Invalid request" },
            { status: 400 },
        );
    }

    try {
        await saveBlocks(authResult.uid, parsed.data.blocks as SavedBlock[]);
        const blocks = await listBlocks(authResult.uid);
        return NextResponse.json({ blocks, message: "Study plan saved." });
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Failed to save blocks" },
            { status: 500 },
        );
    }
}

export async function DELETE(req: Request) {
    const authResult = await authenticate(req);
    if (isAuthError(authResult)) return authResult.error;
    try {
        await clearBlocks(authResult.uid);
        return NextResponse.json({ message: "Study plan cleared." });
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Failed to clear blocks" },
            { status: 500 },
        );
    }
}
