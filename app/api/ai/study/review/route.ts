/**
 * app/api/ai/study/review/route.ts
 *
 * GET  → cards due for spaced-repetition review across all decks
 * POST → grade a card { deckId, cardId, grade }
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticate, isAuthError } from "@/lib/ai/auth";
import { gradeCard, listDueCards } from "@/lib/ai/decks";

export const runtime = "nodejs";

const gradeSchema = z.object({
    deckId: z.string().min(1),
    cardId: z.string().min(1),
    grade: z.enum(["again", "hard", "good", "easy"]),
});

export async function GET(req: Request) {
    const authResult = await authenticate(req);
    if (isAuthError(authResult)) return authResult.error;
    try {
        const due = await listDueCards(authResult.uid);
        return NextResponse.json({ due });
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Failed to load review queue" },
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

    const parsed = gradeSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.issues[0]?.message ?? "Invalid request" },
            { status: 400 },
        );
    }

    try {
        const card = await gradeCard(
            authResult.uid,
            parsed.data.deckId,
            parsed.data.cardId,
            parsed.data.grade,
        );
        if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });
        return NextResponse.json({ card });
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Failed to grade card" },
            { status: 500 },
        );
    }
}
