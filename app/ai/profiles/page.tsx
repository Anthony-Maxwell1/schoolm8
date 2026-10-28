"use client";

import Link from "next/link";
import { useAuth } from "@/context/authContext";
import { useCallback, useEffect, useState } from "react";
import {
    Badge,
    Button,
    Card,
    Checkbox,
    Spinner,
    Textarea,
    TextInput,
} from "@/components/ui/components";
import { Layers, Plus, ArrowLeft } from "lucide-react";

type Profile = {
    id: string;
    name: string;
    context?: string;
    system?: boolean;
    requiredSkillIds?: string[];
};
type Skill = { id: string; name: string };
const empty = { name: "", context: "", requiredSkillIds: [] as string[] };

export default function ProfilesPage() {
    const { token, loading } = useAuth();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [skills, setSkills] = useState<Skill[]>([]);
    const [draft, setDraft] = useState(empty);
    const [editing, setEditing] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const [pending, setPending] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    useEffect(() => {
        if (!open) return;
        const warn = (event: BeforeUnloadEvent) => {
            event.preventDefault();
        };
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [open]);
    const load = useCallback(async () => {
        setPending(true);
        setError("");
        try {
            const headers = { Authorization: `Bearer ${token}` };
            const [p, s] = await Promise.all([
                fetch("/api/ai/profiles", { headers }),
                fetch("/api/ai/skills", { headers }),
            ]);
            if (!p.ok || !s.ok)
                throw new Error("Could not load your profiles and skills. Please try again.");
            setProfiles((await p.json()).profiles ?? []);
            setSkills((await s.json()).skills ?? []);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Could not load profiles.");
        } finally {
            setPending(false);
        }
    }, [token]);
    useEffect(() => {
        if (!token) return;
        const timer = window.setTimeout(() => void load(), 0);
        return () => window.clearTimeout(timer);
    }, [token, load]);
    const start = (profile?: Profile) => {
        if (open && !window.confirm("Discard the current draft?")) return;
        setEditing(profile?.id ?? null);
        setDraft(
            profile
                ? {
                      name: profile.name,
                      context: profile.context ?? "",
                      requiredSkillIds: profile.requiredSkillIds ?? [],
                  }
                : empty,
        );
        setOpen(true);
        setNotice("");
        setError("");
    };
    const save = async () => {
        setSaving(true);
        setError("");
        try {
            const response = await fetch("/api/ai/profiles", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ ...draft, ...(editing ? { id: editing } : {}) }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error ?? "Could not save profile.");
            setOpen(false);
            setDraft(empty);
            setNotice("Profile saved.");
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Could not save profile.");
        } finally {
            setSaving(false);
        }
    };
    const remove = async (profile: Profile) => {
        if (!window.confirm(`Delete “${profile.name}”? This cannot be undone.`)) return;
        setSaving(true);
        setError("");
        try {
            const response = await fetch(`/api/ai/profiles?id=${encodeURIComponent(profile.id)}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error("Could not delete profile. Please try again.");
            if (editing === profile.id) setOpen(false);
            setNotice("Profile deleted.");
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Could not delete profile.");
        } finally {
            setSaving(false);
        }
    };
    return (
        <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 text-sm text-[var(--color-text-primary)] sm:px-6">
            <Link
                href="/ai"
                className="inline-flex items-center gap-2 text-xs text-[var(--color-text-secondary)]"
            >
                <ArrowLeft size={14} /> Back to AI
            </Link>
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="flex items-center gap-2 text-xl font-semibold">
                        <Layers size={20} /> Profiles
                    </h1>
                    <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                        Set the priorities, instructions, and must-read skills for a conversation.
                    </p>
                </div>
                <Button
                    size="sm"
                    leftIcon={<Plus size={14} />}
                    disabled={!token || saving}
                    onClick={() => start()}
                >
                    New profile
                </Button>
            </header>
            {error && (
                <div
                    role="alert"
                    className="rounded-lg border border-[var(--color-border)] p-3 text-sm"
                >
                    {error}{" "}
                    <Button size="xs" variant="ghost" onClick={() => void load()}>
                        Retry loading
                    </Button>
                </div>
            )}
            {notice && (
                <p role="status" className="text-xs text-[var(--color-text-secondary)]">
                    {notice}
                </p>
            )}
            {loading || (token && pending) ? (
                <div role="status" className="flex items-center gap-2 py-12">
                    <Spinner size="sm" /> Loading profiles…
                </div>
            ) : !token ? (
                <Card className="p-6">Sign in to manage your profiles.</Card>
            ) : (
                <>
                    {open && (
                        <Card className="p-5">
                            <form
                                className="space-y-4"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    void save();
                                }}
                            >
                                <div>
                                    <h2 className="font-semibold">
                                        {editing ? "Edit profile" : "Create profile"}
                                    </h2>
                                    <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                                        Give your AI a clear focus. Skills remain available to every
                                        profile.
                                    </p>
                                </div>
                                <TextInput
                                    label="Profile name"
                                    autoFocus
                                    required
                                    maxLength={100}
                                    value={draft.name}
                                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                                    placeholder="e.g. Exam preparation"
                                />
                                <Textarea
                                    label="Instructions & priorities"
                                    required
                                    rows={5}
                                    maxLength={30000}
                                    value={draft.context}
                                    onChange={(e) =>
                                        setDraft({ ...draft, context: e.target.value })
                                    }
                                    placeholder="Describe the goals, tone, and boundaries for this profile…"
                                />
                                <fieldset className="space-y-3">
                                    <legend className="mb-1 text-xs font-semibold">
                                        MUST READ skills
                                    </legend>
                                    <p className="text-xs text-[var(--color-text-secondary)]">
                                        Selected skills are required reading whenever this profile
                                        is used. This does not restrict access to other skills.
                                    </p>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {skills.map((skill) => (
                                            <Checkbox
                                                key={skill.id}
                                                label={skill.name}
                                                checked={draft.requiredSkillIds.includes(skill.id)}
                                                onChange={(e) =>
                                                    setDraft({
                                                        ...draft,
                                                        requiredSkillIds: e.target.checked
                                                            ? [...draft.requiredSkillIds, skill.id]
                                                            : draft.requiredSkillIds.filter(
                                                                  (id) => id !== skill.id,
                                                              ),
                                                    })
                                                }
                                            />
                                        ))}
                                    </div>
                                    {draft.requiredSkillIds
                                        .filter((id) => !skills.some((skill) => skill.id === id))
                                        .map((id) => (
                                            <Checkbox
                                                key={id}
                                                label="Unavailable skill — uncheck to remove"
                                                checked
                                                onChange={() =>
                                                    setDraft({
                                                        ...draft,
                                                        requiredSkillIds:
                                                            draft.requiredSkillIds.filter(
                                                                (skillId) => skillId !== id,
                                                            ),
                                                    })
                                                }
                                            />
                                        ))}
                                    {!skills.length && (
                                        <p className="text-xs">
                                            No skills yet.{" "}
                                            <Link href="/ai/skills" className="underline">
                                                Create a skill
                                            </Link>{" "}
                                            to attach it.
                                        </p>
                                    )}
                                </fieldset>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        type="submit"
                                        loading={saving}
                                        disabled={!draft.name.trim() || !draft.context.trim()}
                                    >
                                        Save profile
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        disabled={saving}
                                        onClick={() => {
                                            if (window.confirm("Discard this draft?"))
                                                setOpen(false);
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {profiles.map((profile) => (
                            <Card key={profile.id} className="flex flex-col gap-4 p-5">
                                <div className="flex items-center justify-between gap-2">
                                    <h2 className="font-semibold">{profile.name}</h2>
                                    <Badge>{profile.system ? "Built-in" : "Personal"}</Badge>
                                </div>
                                <p className="line-clamp-4 whitespace-pre-wrap text-xs leading-relaxed text-[var(--color-text-secondary)]">
                                    {profile.context}
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {(profile.requiredSkillIds ?? []).map((id) => (
                                        <Badge key={id}>
                                            MUST READ ·{" "}
                                            {skills.find((s) => s.id === id)?.name ??
                                                "Unavailable skill"}
                                        </Badge>
                                    ))}
                                </div>
                                <div className="mt-auto flex items-center gap-2 border-t border-[var(--color-border)] pt-3">
                                    {profile.system ? (
                                        <span className="text-xs text-[var(--color-text-secondary)]">
                                            Built-in profiles are read-only
                                        </span>
                                    ) : (
                                        <>
                                            <Button
                                                size="xs"
                                                variant="outline"
                                                disabled={saving}
                                                onClick={() => start(profile)}
                                            >
                                                Edit profile
                                            </Button>
                                            <Button
                                                size="xs"
                                                variant="ghost"
                                                disabled={saving}
                                                onClick={() => void remove(profile)}
                                            >
                                                Delete
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                    {!profiles.length && !error && (
                        <Card className="p-8 text-center">
                            <h2 className="font-semibold">A little direction goes a long way</h2>
                            <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
                                Create a profile to tailor your next conversation.
                            </p>
                            <Button size="sm" className="mt-4" onClick={() => start()}>
                                Create your first profile
                            </Button>
                        </Card>
                    )}
                </>
            )}
        </main>
    );
}
