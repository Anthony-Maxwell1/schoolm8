/**
 * app/api/ai/study/generate/route.ts
 *
 * POST → generate flashcards, a quiz, or a summary from a chosen source
 * (a Canvas assignment, a whole course, or a free-text topic).
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticate, isAuthError } from "@/lib/ai/auth";
import { getDecryptedGeminiKey, getSelectedModel, updateKeyStatus } from "@/lib/ai/geminiKey";
import { resolveModel } from "@/lib/ai/models";
import { classifyGeminiError } from "@/lib/ai/client";
import {
    buildMaterial,
    generateFlashcards,
    generateQuiz,
    generateSummary,
} from "@/lib/ai/study";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
    kind: z.enum(["flashcards", "quiz", "summary"]),
    sourceType: z.enum(["assignment", "course", "topic"]),
    sourceId: z.string().trim().max(128).optional(),
    topic: z.string().trim().max(400).optional(),
    count: z.number().int().min(3).max(40).optional(),
});

export async function POST(req: Request) {
    const authResult = await authenticate(req);
    if (isAuthError(authResult)) return authResult.error;
    const { uid } = authResult;

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.issues[0]?.message ?? "Invalid request" },
            { status: 400 },
        );
    }
    const { kind, sourceType, sourceId, topic, count } = parsed.data;

    const apiKey = await getDecryptedGeminiKey(uid);
    if (!apiKey) {
        return NextResponse.json(
            { error: "no_key", message: "Connect your Gemini key in Settings → AI to use study tools." },
            { status: 409 },
        );
    }
    const model = resolveModel(await getSelectedModel(uid));

    try {
        const { material, label } = await buildMaterial(uid, sourceType, sourceId, topic);

        if (kind === "flashcards") {
            const cards = await generateFlashcards(apiKey, model, material, count ?? 10);
            await updateKeyStatus(uid, "valid").catch(() => {});
            return NextResponse.json({ kind, label, cards });
        }
        if (kind === "quiz") {
            const questions = await generateQuiz(apiKey, model, material, count ?? 8);
            await updateKeyStatus(uid, "valid").catch(() => {});
            return NextResponse.json({ kind, label, questions });
        }
        const summary = await generateSummary(apiKey, model, material);
        await updateKeyStatus(uid, "valid").catch(() => {});
        return NextResponse.json({ kind, label, summary });
    } catch (err) {
        const classified = classifyGeminiError(err);
        if (classified.state === "invalid" || classified.state === "quota") {
            await updateKeyStatus(uid, classified.state).catch(() => {});
            return NextResponse.json({ error: classified.message, state: classified.state }, { status: 502 });
        }
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Failed to generate study material" },
            { status: 500 },
        );
    }
}
