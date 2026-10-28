import { NextResponse } from "next/server";
import { getUid } from "@/lib/access/auth";
import { schema } from "@/lib/firebaseSchema";

const providers = ["claude", "gemini", "chatgpt", "deepseek"] as const;
type Provider = (typeof providers)[number];

const defaults: Record<Provider, string> = {
    claude: "claude-3-5-sonnet-latest",
    gemini: "gemini-2.5-flash",
    chatgpt: "gpt-4o-mini",
    deepseek: "deepseek-chat",
};

function publicSettings(config: Record<string, unknown> | null) {
    const provider = providers.includes(config?.provider as Provider)
        ? (config?.provider as Provider)
        : "gemini";
    return {
        provider,
        model: typeof config?.model === "string" ? config.model : defaults[provider],
        hasApiKey: typeof config?.apiKey === "string" && config.apiKey.length > 0,
        keyLast4:
            typeof config?.apiKey === "string" && config.apiKey.length >= 4
                ? `••••${config.apiKey.slice(-4)}`
                : null,
    };
}

export async function GET(req: Request) {
    try {
        const userId = getUid(req);
        return NextResponse.json(publicSettings(await schema.ai.getConfig(userId)));
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to load AI settings" },
            { status: 500 },
        );
    }
}

export async function PUT(req: Request) {
    try {
        const userId = getUid(req);
        const body = await req.json();
        const current = (await schema.ai.getConfig(userId)) ?? {};
        const provider = body.provider ?? current.provider ?? "gemini";
        if (!providers.includes(provider)) {
            return NextResponse.json({ error: "Unsupported AI provider" }, { status: 400 });
        }
        if (
            provider !== current.provider &&
            !(typeof body.apiKey === "string" && body.apiKey.trim())
        ) {
            return NextResponse.json(
                { error: "Add an API key for the selected provider first." },
                { status: 400 },
            );
        }
        const model =
            typeof body.model === "string" && body.model.trim()
                ? body.model.trim()
                : provider === current.provider && typeof current.model === "string"
                  ? current.model
                  : defaults[provider as Provider];
        if (typeof model !== "string" || !model.trim()) {
            return NextResponse.json({ error: "A model is required" }, { status: 400 });
        }
        const update: Record<string, unknown> = { provider, model };
        if (typeof body.apiKey === "string" && body.apiKey.trim()) {
            update.apiKey = body.apiKey.trim();
        }
        await schema.ai.saveConfig(userId, { ...current, ...update });
        return NextResponse.json(publicSettings({ ...current, ...update }));
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to save AI settings" },
            { status: 400 },
        );
    }
}

export async function DELETE(req: Request) {
    try {
        const userId = getUid(req);
        const current = (await schema.ai.getConfig(userId)) ?? {};
        const withoutKey = { ...current };
        delete withoutKey.apiKey;
        await schema.ai.saveConfig(userId, withoutKey);
        return NextResponse.json(publicSettings(withoutKey));
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to remove AI key" },
            { status: 500 },
        );
    }
}
