/**
 * app/api/ai/study/decks/route.ts
 *
 * GET    → list saved flashcard decks (with due counts)
 * POST   → save a generated deck
 * DELETE → delete a deck (?id=)
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticate, isAuthError } from "@/lib/ai/auth";
import { deleteDeck, listDecks, saveDeck } from "@/lib/ai/decks";

export const runtime = "nodejs";

const postSchema = z.object({
    title: z.string().trim().min(1).max(160),
    sourceLabel: z.string().trim().max(200).optional(),
    cards: z
        .array(z.object({ front: z.string().min(1).max(400), back: z.string().min(1).max(1200) }))
        .min(1)
        .max(60),
});

export async function GET(req: Request) {
    const authResult = await authenticate(req);
    if (isAuthError(authResult)) return authResult.error;
    try {
        const decks = await listDecks(authResult.uid);
        return NextResponse.json({ decks });
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Failed to load decks" },
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
        const deck = await saveDeck(
            authResult.uid,
            parsed.data.title,
            parsed.data.sourceLabel ?? parsed.data.title,
            parsed.data.cards,
        );
        return NextResponse.json({ deck, message: "Deck saved." });
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Failed to save deck" },
            { status: 500 },
        );
    }
}

export async function DELETE(req: Request) {
    const authResult = await authenticate(req);
    if (isAuthError(authResult)) return authResult.error;

    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing deck id" }, { status: 400 });

    try {
        await deleteDeck(authResult.uid, id);
        return NextResponse.json({ message: "Deck deleted." });
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Failed to delete deck" },
            { status: 500 },
        );
    }
}
