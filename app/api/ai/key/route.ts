/**
 * app/api/ai/key/route.ts
 *
 * Manage the student's own Gemini API key (BYO key model).
 *   GET    → current status (never returns the key itself)
 *   POST   → validate a pasted key with a live test call, then store encrypted
 *            (also used to change the selected model)
 *   DELETE → remove the stored key
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticate, isAuthError } from "@/lib/ai/auth";
import { validateGeminiKey } from "@/lib/ai/client";
import {
    deleteGeminiKey,
    getPublicAiSettings,
    saveGeminiKey,
    saveSelectedModel,
    testApiKey,
} from "@/lib/ai/geminiKey";
import { isValidModelId } from "@/lib/ai/models";
import { get } from "http";

export const runtime = "nodejs";

const postSchema = z
    .object({
        // A Google AI Studio key. Most start with "AIza" but we don't enforce the
        // prefix — we verify it live instead. Optional so the same endpoint can
        // update just the model.
        apiKey: z.string().trim().min(10).max(400).optional(),
        model: z.string().trim().optional(),
    })
    .refine((v) => v.apiKey != null || v.model != null, {
        message: "Provide an apiKey, a model, or both.",
    });

export async function GET(req: Request) {
    const authResult = await authenticate(req);
    if (isAuthError(authResult)) return authResult.error;

    try {
        const settings = await getPublicAiSettings(authResult.uid);
        return NextResponse.json(settings);
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Failed to read AI settings" },
            { status: 500 },
        );
    }
}

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

    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.issues[0]?.message ?? "Invalid request" },
            { status: 400 },
        );
    }

    const { apiKey, model } = parsed.data;

    try {
        // Update model selection if provided (validate against the registry).
        if (model != null) {
            if (!isValidModelId(model)) {
                return NextResponse.json({ error: "Unknown model" }, { status: 400 });
            }
            await saveSelectedModel(uid, model);

            await testApiKey(uid);
        }

        // If a key was supplied, verify it before storing.
        let note = "AI settings updated.";
        if (apiKey != null) {
            const result = await validateGeminiKey(apiKey);

            if (result.state === "invalid") {
                // Genuinely bad key — don't store it.
                return NextResponse.json(
                    { error: result.message, state: "invalid" },
                    { status: 400 },
                );
            }
            if (result.state === "error") {
                return NextResponse.json(
                    { error: result.message, state: "error" },
                    { status: 502 },
                );
            }

            await saveGeminiKey(uid, apiKey, result.state === "quota" ? "quota" : "valid");
            note =
                result.state === "quota"
                    ? "Key saved. It's rate-limited by Google's free tier right now but will work once that resets."
                    : "Key verified and saved.";
        }

        const settings = await getPublicAiSettings(uid);
        return NextResponse.json({ ...settings, message: note });
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Failed to update AI settings" },
            { status: 500 },
        );
    }
}

export async function DELETE(req: Request) {
    const authResult = await authenticate(req);
    if (isAuthError(authResult)) return authResult.error;

    try {
        await deleteGeminiKey(authResult.uid);
        const settings = await getPublicAiSettings(authResult.uid);
        return NextResponse.json({ ...settings, message: "Gemini key removed." });
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Failed to remove key" },
            { status: 500 },
        );
    }
}
