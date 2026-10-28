import { NextResponse } from "next/server";
import { getUid } from "@/lib/access/auth";
import { schema } from "@/lib/firebaseSchema";

type Provider = "claude" | "gemini" | "chatgpt" | "deepseek";

function providerUrl(provider: Provider, apiKey: string) {
    if (provider === "gemini") {
        return `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
    }
    if (provider === "claude") return "https://api.anthropic.com/v1/models";
    if (provider === "deepseek") return "https://api.deepseek.com/models";
    return "https://api.openai.com/v1/models";
}

function headers(provider: Provider, apiKey: string): HeadersInit {
    return provider === "gemini"
        ? {}
        : provider === "claude"
          ? { "x-api-key": apiKey, "anthropic-version": "2023-06-01" }
          : { Authorization: `Bearer ${apiKey}` };
}

export async function GET(req: Request) {
    try {
        const userId = getUid(req);
        const provider = new URL(req.url).searchParams.get("provider") as Provider;
        if (!["claude", "gemini", "chatgpt", "deepseek"].includes(provider)) {
            return NextResponse.json({ error: "Unsupported AI provider" }, { status: 400 });
        }
        const config = await schema.ai.getConfig(userId);
        if (config?.provider !== provider || typeof config.apiKey !== "string" || !config.apiKey) {
            return NextResponse.json(
                { error: "Save an API key for this provider first." },
                { status: 400 },
            );
        }
        const response = await fetch(providerUrl(provider, config.apiKey), {
            headers: headers(provider, config.apiKey),
            cache: "no-store",
        });
        const payload = await response.json();
        if (!response.ok) {
            return NextResponse.json(
                {
                    error:
                        payload?.error?.message ??
                        payload?.error ??
                        "Provider rejected the API key.",
                },
                { status: response.status },
            );
        }
        const availableModels = Array.isArray(payload.models)
            ? payload.models
            : Array.isArray(payload.data)
              ? payload.data
              : [];
        const models = availableModels
            .filter(
                (model: { name?: string; id?: string; supportedGenerationMethods?: string[] }) =>
                    provider !== "gemini" ||
                    model.supportedGenerationMethods?.includes("generateContent"),
            )
            .map((model: { name?: string; id?: string }) => {
                const id = provider === "gemini" ? model.name?.replace(/^models\//, "") : model.id;
                return id ? { id, label: id, description: "Available from your API key." } : null;
            })
            .filter(Boolean);
        return NextResponse.json({ models });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to load models" },
            { status: 500 },
        );
    }
}
