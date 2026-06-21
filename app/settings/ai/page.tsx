"use client";

/**
 * Settings → AI
 *
 * The student pastes their own Google Gemini API key. We validate it with a
 * live test call server-side, store it encrypted, show its status, let them
 * pick a model, and delete it. The key is never returned to the browser.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { Sparkles, KeyRound, Trash2, ExternalLink, CheckCircle2 } from "lucide-react";
import {
    Text,
    Divider,
    Badge,
    Button,
    TextInput,
    Select,
    Card,
    Alert,
    Spinner,
} from "@/components/ui/components";
import { useAuth } from "@/context/authContext";
import type { PublicAiSettings, KeyStatus } from "@/lib/ai/geminiKey";

interface GeminiModel {
    id: string;
    label: string;
    description: string;
}

const STATUS_META: Record<
    KeyStatus,
    { label: string; variant: "success" | "danger" | "warning" | "default" }
> = {
    valid: { label: "Connected", variant: "success" },
    invalid: { label: "Invalid key", variant: "danger" },
    quota: { label: "Rate limited", variant: "warning" },
    error: { label: "Needs checking", variant: "warning" },
    unset: { label: "Not connected", variant: "default" },
};

export default function AiSettingsPage() {
    const { user, loading: authLoading, token } = useAuth();
    const [settings, setSettings] = useState<PublicAiSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [keyInput, setKeyInput] = useState("");
    const [saving, setSaving] = useState(false);
    const [savingModel, setSavingModel] = useState(false);
    const [models, setModels] = useState<GeminiModel[]>([]);

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch("/api/ai/key", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error((await res.json()).error ?? "Failed to load");
            setSettings(await res.json());
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to load AI settings");
        } finally {
            setLoading(false);
        }
    }, [token]);

    const fetchModels = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch("/api/ai/models", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error((await res.json()).error ?? "Failed to load models");
            const data = await res.json();
            setModels(data.models);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to load models");
        }
    }, [token]);

    useEffect(() => {
        if (!authLoading && token) {
            load();
            fetchModels();
        }
    }, [authLoading, token, load, fetchModels]);

    const saveKey = async () => {
        const trimmed = keyInput.trim();
        if (!trimmed) {
            toast.error("Paste your Gemini API key first.");
            return;
        }
        setSaving(true);
        try {
            const res = await fetch("/api/ai/key", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ apiKey: trimmed }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Could not save key");
            setSettings(data);
            setKeyInput("");
            toast.success("Gemini key verified and saved.");

            // Auto-select first model if none set yet
            if (!data.model && models.length > 0) {
                await changeModel(models[0].id);
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not save key");
        } finally {
            setSaving(false);
        }
    };

    const changeModel = async (model: string) => {
        setSavingModel(true);
        try {
            const res = await fetch("/api/ai/key", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ model }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Could not update model");
            setSettings(data);
            toast.success("Model updated.");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not update model");
        } finally {
            setSavingModel(false);
        }
    };

    const removeKey = async () => {
        if (
            !confirm(
                "Remove your Gemini key? AI features will stop working until you add a new one.",
            )
        ) {
            return;
        }
        try {
            const res = await fetch("/api/ai/key", {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Could not remove key");
            setSettings(data);
            toast.success("Gemini key removed.");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not remove key");
        }
    };

    const status = settings?.keyStatus ?? "unset";
    const statusMeta = STATUS_META[status];

    return (
        <div className="min-h-screen bg-[var(--color-surface)] px-6 py-20">
            <div className="mx-auto max-w-lg">
                <Text variant="label" className="mb-2 block">
                    Settings
                </Text>
                <h1 className="font-[family-name:var(--font-display)] text-[42px] leading-[1.1] tracking-[-0.01em] font-normal text-[var(--color-text-primary)]">
                    AI &amp; API keys
                </h1>
                <Text variant="bodyLg" className="mt-3 text-[var(--color-text-secondary)]">
                    SchoolMate&apos;s tutor, scheduler, and study tools run on your own{" "}
                    <em>Google Gemini</em> key — free to create, and used only for your account.
                </Text>

                <Divider className="my-10" />

                {authLoading || loading ? (
                    <div className="flex items-center gap-3 py-8 text-[var(--color-text-secondary)]">
                        <Spinner size="sm" /> Loading your AI settings…
                    </div>
                ) : !user ? (
                    <Alert
                        variant="warning"
                        title="Sign in required"
                        description="Sign in to manage your Gemini key."
                    />
                ) : (
                    <>
                        {/* Current status */}
                        <Card className="mb-8">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-subtle)] text-[var(--color-primary)]">
                                        <Sparkles className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-[var(--color-text-primary)]">
                                            Gemini API key
                                        </p>
                                        <p className="text-sm text-[var(--color-text-secondary)]">
                                            {settings?.hasKey
                                                ? `Saved key ${settings.keyLast4 ?? ""}`
                                                : "No key on file yet"}
                                        </p>
                                    </div>
                                </div>
                                <Badge variant={statusMeta.variant} dot>
                                    {statusMeta.label}
                                </Badge>
                            </div>

                            {settings?.hasKey && (
                                <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border-subtle)] pt-4">
                                    <p className="text-xs text-[var(--color-text-tertiary)]">
                                        {settings.lastCheckedAt
                                            ? `Last checked ${new Date(settings.lastCheckedAt).toLocaleString()}`
                                            : "Not checked yet"}
                                    </p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        leftIcon={<Trash2 className="h-4 w-4" />}
                                        onClick={removeKey}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            )}
                        </Card>

                        {status === "invalid" && (
                            <Alert
                                variant="danger"
                                title="Key rejected"
                                description="Google rejected this key. Paste a fresh one from AI Studio below."
                                className="mb-6"
                            />
                        )}
                        {status === "quota" && (
                            <Alert
                                variant="warning"
                                title="Rate limited"
                                description="Your key works but recently hit a free-tier limit. Wait a moment, or switch to a faster model below."
                                className="mb-6"
                            />
                        )}

                        {/* Key entry */}
                        <Text variant="label" className="mb-1 block">
                            {settings?.hasKey ? "Replace key" : "Add your key"}
                        </Text>
                        <Text variant="bodySm" className="mb-3">
                            Paste the key from{" "}
                            <Link
                                href="https://aistudio.google.com/app/apikey"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[var(--color-primary)] underline underline-offset-2"
                            >
                                Google AI Studio
                            </Link>
                            . Most keys look like{" "}
                            <code className="rounded bg-[var(--color-muted)] px-1 py-0.5 text-[0.85em]">
                                AIzaSy…
                            </code>{" "}
                            but yours may differ — we verify it for you, so just paste what AI
                            Studio gave you.
                        </Text>
                        <div className="flex items-start gap-2">
                            <TextInput
                                type="password"
                                autoComplete="off"
                                placeholder="AIzaSy…"
                                value={keyInput}
                                onChange={(e) => setKeyInput(e.target.value)}
                                className="flex-1"
                                aria-label="Gemini API key"
                            />
                            <Button
                                onClick={saveKey}
                                loading={saving}
                                leftIcon={!saving ? <KeyRound className="h-4 w-4" /> : undefined}
                            >
                                {saving ? "Verifying…" : "Validate & save"}
                            </Button>
                        </div>

                        {/* Model selection */}
                        <Divider className="my-8" />
                        <Text variant="label" className="mb-1 block">
                            Model
                        </Text>
                        <Text variant="bodySm" className="mb-3">
                            Choose which Gemini model powers your tutor, scheduler, and study tools.
                        </Text>
                        <Select
                            value={settings?.model ?? models[0]?.id}
                            disabled={savingModel}
                            onChange={(e) => changeModel(e.target.value)}
                            options={models.map((m) => ({ value: m.id, label: m.label }))}
                        />
                        <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
                            {
                                models.find((m) => m.id === (settings?.model ?? models[0]?.id))
                                    ?.description
                            }
                        </p>

                        {/* Help */}
                        <Divider className="my-8" />
                        <div className="flex flex-wrap items-center gap-2">
                            <Link href="/docs/gemini-setup">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    rightIcon={<ExternalLink className="h-3.5 w-3.5" />}
                                >
                                    Step-by-step setup guide
                                </Button>
                            </Link>
                            {status === "valid" && (
                                <span className="inline-flex items-center gap-1.5 text-sm text-[var(--color-success)]">
                                    <CheckCircle2 className="h-4 w-4" /> Ready to use
                                </span>
                            )}
                        </div>

                        <p className="mt-6 text-xs text-[var(--color-text-tertiary)]">
                            Your key is encrypted at rest and scoped to your account. It is only
                            used to make Gemini requests on your behalf and is never shown in the
                            browser.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
