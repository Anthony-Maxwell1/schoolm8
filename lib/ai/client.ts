/**
 * lib/ai/client.ts
 *
 * Server-only helpers for talking to Google Gemini with a user's own API key.
 * All Gemini traffic flows through here so error handling (invalid key, quota,
 * network) is consistent across the Tutor, Scheduler, and Study suite.
 */

import { GoogleGenAI } from "@google/genai";

export type GeminiKeyState = "valid" | "invalid" | "quota" | "error";

export interface KeyValidationResult {
    state: GeminiKeyState;
    message: string;
}

/** Construct a Gemini client bound to a single user's key. */
export function createGeminiClient(apiKey: string): GoogleGenAI {
    return new GoogleGenAI({ apiKey });
}

/**
 * Classify an error thrown by the Gemini SDK into a coarse state the UI and
 * key-status badge understand. Gemini surfaces HTTP-ish errors with a status
 * code and message; we sniff both.
 */
export function classifyGeminiError(err: unknown): KeyValidationResult {
    const raw =
        err instanceof Error ? err.message : typeof err === "string" ? err : JSON.stringify(err);
    const lower = raw.toLowerCase();

    if (
        lower.includes("api key not valid") ||
        lower.includes("api_key_invalid") ||
        lower.includes("invalid api key") ||
        lower.includes("permission denied") ||
        lower.includes("permission_denied") ||
        lower.includes("401") ||
        lower.includes("403")
    ) {
        return {
            state: "invalid",
            message:
                "Google rejected this key. Make sure it's a Gemini API key created at " +
                "aistudio.google.com (not an OAuth client ID or a Google Cloud key), and that the " +
                "Generative Language API is enabled for it.",
        };
    }

    if (
        lower.includes("quota") ||
        lower.includes("rate limit") ||
        lower.includes("resource_exhausted") ||
        lower.includes("429")
    ) {
        return {
            state: "quota",
            message: "Your key is valid but has hit a rate or quota limit. Try again shortly.",
        };
    }

    return {
        state: "error",
        message: "Could not reach Gemini. Check your connection and try again.",
    };
}

/**
 * Verify a key actually works before we store it.
 *
 * We use models.list() rather than a generateContent call: listing models
 * authenticates the key WITHOUT consuming the (often tiny) free-tier generation
 * quota, so validation never trips a 429. If it somehow does, that 429 still
 * proves the key authenticated, so we report "quota" (a usable key) rather than
 * an outright failure.
 */
export async function validateGeminiKey(apiKey: string): Promise<KeyValidationResult> {
    try {
        const ai = createGeminiClient(apiKey);
        // Awaiting list() makes the first ListModels request and throws on a bad key.
        await ai.models.list({ config: { pageSize: 1 } });
        return { state: "valid", message: "Key verified and ready to use." };
    } catch (err) {
        const classified = classifyGeminiError(err);
        if (classified.state === "quota") {
            return {
                state: "quota",
                message: "Key accepted — it's just rate-limited by Google's free tier right now.",
            };
        }
        return classified;
    }
}
