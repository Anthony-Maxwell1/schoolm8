"use client";

import { SiAnthropic, SiGooglegemini } from "@icons-pack/react-simple-icons";
import { BrainCircuit, Bot, Check, KeyRound, Trash2 } from "lucide-react";
import { useAuth } from "@/context/authContext";
import { Badge, Button, Card, Divider, Select, Text, TextInput } from "@/components/ui/components";
import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import { toast } from "react-toastify";

type Provider = "claude" | "gemini" | "chatgpt" | "deepseek";
type Model = { id: string; label: string; description: string };
type Settings = {
    provider: Provider;
    model: string;
    hasApiKey: boolean;
    keyLast4: string | null;
};
type Icon = ComponentType<{ className?: string }>;

const providerInfo: Record<
    Provider,
    { name: string; Icon: Icon; chips: string[]; description: string }
> = {
    claude: {
        name: "Claude",
        Icon: SiAnthropic,
        chips: ["Good at problem solving", "Expensive"],
        description: "Careful, thoughtful answers and strong reasoning.",
    },
    gemini: {
        name: "Gemini",
        Icon: SiGooglegemini,
        chips: [
            "Good at research",
            "Cheap",
            "Free plan that covers almost all learners",
            "Recommended",
        ],
        description: "A balanced choice for everyday school work.",
    },
    chatgpt: {
        name: "ChatGPT",
        Icon: Bot,
        chips: ["Fast", "Multifunction", "Hallucinates often"],
        description: "Fast general-purpose assistance.",
    },
    deepseek: {
        name: "DeepSeek",
        Icon: BrainCircuit,
        chips: ["Good value", "Reasoning"],
        description: "Affordable general chat and reasoning.",
    },
};

export default function AiSettingsPage() {
    const { token, loading: authLoading } = useAuth();
    const [settings, setSettings] = useState<Settings | null>(null);
    const [models, setModels] = useState<Model[]>([]);
    const [key, setKey] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
    const loadModels = useCallback(
        async (provider: Provider) => {
            const response = await fetch(`/api/ai/models?provider=${provider}`, { headers });
            if (!response.ok) throw new Error("Could not load provider models");
            const data = await response.json();
            setModels(data.models ?? []);
            return data.models as Model[];
        },
        [headers],
    );
    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await fetch("/api/ai/settings", { headers });
            if (!response.ok) throw new Error("Could not load AI settings");
            const data = (await response.json()) as Settings;
            setSettings(data);
            if (data.hasApiKey) await loadModels(data.provider);
            else setModels([]);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not load AI settings");
        } finally {
            setLoading(false);
        }
    }, [headers, loadModels, token]);

    useEffect(() => {
        if (authLoading || !token) return;
        const timer = window.setTimeout(() => void load(), 0);
        return () => window.clearTimeout(timer);
    }, [authLoading, load, token]);

    const selectProvider = async (provider: Provider) => {
        if (!settings) return;
        if (provider === settings.provider) return;
        setModels([]);
        setKey("");
        setSettings({
            ...settings,
            provider,
            model: "",
            hasApiKey: false,
            keyLast4: null,
        });
    };

    const save = async () => {
        if (!settings) return;
        setSaving(true);
        try {
            const response = await fetch("/api/ai/settings", {
                method: "PUT",
                headers: { ...headers, "Content-Type": "application/json" },
                body: JSON.stringify({
                    provider: settings.provider,
                    model: settings.model,
                    apiKey: key,
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error ?? "Could not save AI settings");
            const availableModels = await loadModels(data.provider);
            const selectedModel = availableModels[0]?.id ?? data.model;
            setSettings({ ...data, model: selectedModel });
            if (selectedModel && selectedModel !== data.model) {
                await fetch("/api/ai/settings", {
                    method: "PUT",
                    headers: { ...headers, "Content-Type": "application/json" },
                    body: JSON.stringify({ provider: data.provider, model: selectedModel }),
                });
            }
            setKey("");
            toast.success("AI settings saved");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not save AI settings");
        } finally {
            setSaving(false);
        }
    };

    const removeKey = async () => {
        const response = await fetch("/api/ai/settings", { method: "DELETE", headers });
        if (!response.ok) {
            toast.error("Could not remove API key");
            return;
        }
        setSettings(await response.json());
        setKey("");
        toast.success("API key removed");
    };

    if (authLoading || loading) {
        return <div className="p-8">Loading AI settings…</div>;
    }
    if (!settings) {
        return <div className="p-8">Sign in to configure AI.</div>;
    }

    return (
        <div className="min-h-screen bg-[var(--color-surface)] px-6 py-20">
            <div className="mx-auto max-w-4xl">
                <Text variant="label" className="mb-2 block">
                    Configuration
                </Text>
                <h1 className="font-[family-name:var(--font-display)] text-[42px] leading-[1.1] font-normal text-[var(--color-text-primary)]">
                    AI provider
                </h1>
                <Text variant="bodyLg" className="mt-3 text-[var(--color-text-secondary)]">
                    Choose the assistant that powers your schoolwork and planning tools.
                </Text>
                <Divider className="my-10" />

                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {(Object.keys(providerInfo) as Provider[]).map((provider) => {
                        const info = providerInfo[provider];
                        const selected = settings.provider === provider;
                        return (
                            <Card
                                key={provider}
                                variant={selected ? "hoverable" : "default"}
                                className={`relative aspect-square overflow-hidden p-4 transition ${
                                    selected
                                        ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20"
                                        : "hover:-translate-y-0.5"
                                }`}
                            >
                                <button
                                    type="button"
                                    aria-label={`Select ${info.name}`}
                                    onClick={() => void selectProvider(provider)}
                                    className="absolute inset-0 z-0 cursor-pointer"
                                />
                                <div className="pointer-events-none flex items-start justify-between">
                                    <div className="flex max-w-[85%] flex-wrap gap-1">
                                        {info.chips.slice(0, 2).map((chip) => (
                                            <Badge
                                                key={chip}
                                                variant={
                                                    chip === "Recommended" ? "primary" : "default"
                                                }
                                                pill
                                                className="text-[10px]"
                                            >
                                                {chip}
                                            </Badge>
                                        ))}
                                    </div>
                                    {selected && (
                                        <Check className="h-5 w-5 text-[var(--color-primary)]" />
                                    )}
                                </div>
                                <div className="pointer-events-none absolute inset-x-4 bottom-4">
                                    <info.Icon className="mb-4 h-16 w-16 text-[var(--color-primary)]" />
                                    <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                                        {info.name}
                                    </h2>
                                    <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                                        {info.description}
                                    </p>
                                </div>
                                {selected && (
                                    <div
                                        className="absolute inset-x-2 bottom-2 z-10 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-3 shadow-lg"
                                        onClick={(event) => event.stopPropagation()}
                                    >
                                        <TextInput
                                            type="password"
                                            value={key}
                                            onChange={(event) => setKey(event.target.value)}
                                            placeholder={
                                                settings.hasApiKey
                                                    ? (settings.keyLast4 ?? "Saved key")
                                                    : "API key"
                                            }
                                            inputSize="sm"
                                            aria-label={`${info.name} API key`}
                                        />
                                        <Select
                                            className="mt-2"
                                            value={settings.model}
                                            onChange={(event) =>
                                                setSettings({
                                                    ...settings,
                                                    model: event.target.value,
                                                })
                                            }
                                            options={models.map((model) => ({
                                                value: model.id,
                                                label: model.label,
                                            }))}
                                        />
                                        <Button
                                            className="mt-2 w-full"
                                            size="sm"
                                            loading={saving}
                                            leftIcon={<KeyRound className="h-3.5 w-3.5" />}
                                            onClick={() => void save()}
                                        >
                                            Save
                                        </Button>
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>

                {settings.hasApiKey && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mt-6"
                        leftIcon={<Trash2 className="h-4 w-4" />}
                        onClick={() => void removeKey()}
                    >
                        Remove saved API key
                    </Button>
                )}
            </div>
        </div>
    );
}
