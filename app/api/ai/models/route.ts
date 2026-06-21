import { authenticate, isAuthError } from "@/lib/ai/auth";
import { createGeminiClient } from "@/lib/ai/client";
import { getDecryptedGeminiKey } from "@/lib/ai/geminiKey";
import { NextRequest, NextResponse } from "next/server";

// Patterns in the model name that indicate it's NOT a general text/chat model
const EXCLUDE_PATTERNS = [
    "embedding",
    "imagen",
    "veo",
    "lyria",
    "aqa",
    "tts",
    "audio",
    "live",
    "computer-use",
    "robotics",
    "image", // gemini-2.5-flash-image, gemini-3-pro-image etc
    "translate",
    "antigravity", // internal/experimental
    "nano-banana", // internal/experimental
    "deep-research", // research-only, not chat
    "customtools",
];

// Only keep stable/preview chat models — alias names like gemini-flash-latest are fine too
const REQUIRE_ONE_OF = ["gemini", "gemma"];

export async function GET(req: NextRequest) {
    const authResult = await authenticate(req);
    if (isAuthError(authResult)) return authResult.error;

    try {
        const key = await getDecryptedGeminiKey(authResult.uid);
        if (!key) throw new Error("No API key found");

        const client = createGeminiClient(key);
        const models = [];

        for await (const m of await client.models.list()) {
            const name = m.name ?? "";

            if (!REQUIRE_ONE_OF.some((p) => name.includes(p))) continue;
            if (EXCLUDE_PATTERNS.some((p) => name.includes(p))) continue;

            models.push({
                id: name,
                label: m.displayName ?? name,
                description: m.description ?? "",
            });
        }

        return NextResponse.json({ models });
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Failed to read AI settings" },
            { status: 500 },
        );
    }
}
