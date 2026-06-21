/**
 * lib/ai/models.ts
 *
 * Curated registry of Gemini models the user can pick from, shared by the
 * Settings → AI model selector and every server route. Keeping this in one
 * place means the selector and the validation logic never drift apart.
 */

export interface GeminiModel {
    id: string;
    label: string;
    description: string;
    /** Rough relative speed/capability hint for the UI. */
    tier: "fast" | "balanced" | "powerful";
}

export const GEMINI_MODELS: GeminiModel[] = [
    {
        id: "gemini-2.0-flash",
        label: "Gemini 2.0 Flash",
        description: "Fast, capable, generous free tier. Recommended default.",
        tier: "balanced",
    },
    {
        id: "gemini-2.0-flash-lite",
        label: "Gemini 2.0 Flash-Lite",
        description: "Lowest latency and cost. Best for quick replies.",
        tier: "fast",
    },
    {
        id: "gemini-2.5-flash",
        label: "Gemini 2.5 Flash",
        description: "Stronger reasoning, still fast. Higher token usage.",
        tier: "balanced",
    },
    {
        id: "gemini-2.5-pro",
        label: "Gemini 2.5 Pro",
        description: "Most capable for hard problems. Slower, stricter limits.",
        tier: "powerful",
    },
    {
        id: "gemini-1.5-flash",
        label: "Gemini 1.5 Flash",
        description: "Legacy fast model. Use if newer models are unavailable.",
        tier: "fast",
    },
]; // extremely outdated

export const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash";

export function isValidModelId(id: string): boolean {
    return true; // TODO: strict validation through gemini api
}

export function resolveModel(id: string | undefined | null): string {
    return id && isValidModelId(id) ? id : DEFAULT_GEMINI_MODEL;
}
