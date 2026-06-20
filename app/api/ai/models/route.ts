import { authenticate, isAuthError } from "@/lib/ai/auth";
import { createGeminiClient } from "@/lib/ai/client";
import { getDecryptedGeminiKey } from "@/lib/ai/geminiKey";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const authResult = await authenticate(req);
    if (isAuthError(authResult)) return authResult.error;

    try {
        const key = await getDecryptedGeminiKey(authResult.uid);
        if (!key) {
            throw new Error("No API key found");
        }

        const client = createGeminiClient(key);
        const models = [];

        for await (const m of await client.models.list()) {
            if (!m.name?.includes("gemini") || !m.supportedActions?.includes("generateContent"))
                continue;
            models.push({
                id: m.name,
                label: m.displayName ?? m.name,
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
