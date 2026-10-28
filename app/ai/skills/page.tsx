"use client";

import Link from "next/link";
import { useAuth } from "@/context/authContext";
import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card, Spinner, Textarea, TextInput } from "@/components/ui/components";
import { ArrowLeft, BookOpen, Plus, Search } from "lucide-react";

type Skill = { id: string; name: string; instructions?: string; system?: boolean };
const empty = { name: "", instructions: "" };

export default function SkillsPage() {
    const { token, loading } = useAuth();
    const [skills, setSkills] = useState<Skill[]>([]);
    const [selected, setSelected] = useState<Skill | null>(null);
    const [draft, setDraft] = useState(empty);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [pending, setPending] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const readonly = !!selected?.system;
    const dirty =
        open &&
        !readonly &&
        (draft.name !== (selected?.name ?? "") ||
            draft.instructions !== (selected?.instructions ?? ""));
    const load = useCallback(async () => {
        setPending(true);
        setError("");
        try {
            const response = await fetch("/api/ai/skills", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error("Could not load skills. Please try again.");
            setSkills((await response.json()).skills ?? []);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Could not load skills.");
        } finally {
            setPending(false);
        }
    }, [token]);
    useEffect(() => {
        if (!token) return;
        const timer = window.setTimeout(() => void load(), 0);
        return () => window.clearTimeout(timer);
    }, [token, load]);
    useEffect(() => {
        if (!dirty) return;
        const warn = (event: BeforeUnloadEvent) => {
            event.preventDefault();
        };
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [dirty]);
    const start = (skill?: Skill) => {
        if (dirty && !window.confirm("Discard your unsaved changes?")) return;
        setSelected(skill ?? null);
        setDraft(skill ? { name: skill.name, instructions: skill.instructions ?? "" } : empty);
        setOpen(true);
        setNotice("");
        setError("");
    };
    const save = async () => {
        setSaving(true);
        setError("");
        try {
            const response = await fetch("/api/ai/skills", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ ...draft, ...(selected ? { id: selected.id } : {}) }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error ?? "Could not save skill.");
            setOpen(false);
            setSelected(null);
            setDraft(empty);
            setNotice("Skill saved. It is available across all profiles.");
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Could not save skill.");
        } finally {
            setSaving(false);
        }
    };
    const remove = async () => {
        if (
            !selected ||
            readonly ||
            !window.confirm(
                `Delete “${selected.name}”? Profiles referencing it will no longer have these instructions.`,
            )
        )
            return;
        setSaving(true);
        setError("");
        try {
            const response = await fetch(`/api/ai/skills?id=${encodeURIComponent(selected.id)}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error("Could not delete skill. Please try again.");
            setOpen(false);
            setSelected(null);
            setNotice("Skill deleted.");
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Could not delete skill.");
        } finally {
            setSaving(false);
        }
    };
    const filtered = skills.filter((skill) =>
        `${skill.name} ${skill.instructions ?? ""}`.toLowerCase().includes(query.toLowerCase()),
    );
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
                        <BookOpen size={20} /> Skills
                    </h1>
                    <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                        Reusable instructions. Available globally, with any profile.
                    </p>
                </div>
                <Button
                    size="sm"
                    leftIcon={<Plus size={14} />}
                    disabled={!token || saving}
                    onClick={() => start()}
                >
                    New skill
                </Button>
            </header>
            {error && (
                <div role="alert" className="rounded-lg border border-[var(--color-border)] p-3">
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
                    <Spinner size="sm" /> Loading skills…
                </div>
            ) : !token ? (
                <Card className="p-6">Sign in to manage your skills.</Card>
            ) : (
                <div className="grid items-start gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
                    <section className="space-y-3" aria-label="Skill library">
                        <TextInput
                            aria-label="Search skills"
                            inputSize="sm"
                            placeholder="Search your skills…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <div className="space-y-2">
                            {filtered.map((skill) => (
                                <button
                                    key={skill.id}
                                    disabled={saving}
                                    aria-pressed={open && selected?.id === skill.id}
                                    onClick={() => start(skill)}
                                    className={`w-full rounded-xl border p-4 text-left transition-colors hover:bg-[var(--color-surface)] ${open && selected?.id === skill.id ? "border-[var(--color-primary)] bg-[var(--color-surface)]" : "border-[var(--color-border)] bg-[var(--color-surface-raised)]"}`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm font-medium">{skill.name}</span>
                                        <Badge>{skill.system ? "Built-in" : "Personal"}</Badge>
                                    </div>
                                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                                        {skill.instructions}
                                    </p>
                                </button>
                            ))}
                        </div>
                        {!filtered.length && (
                            <Card className="p-5">
                                <Search size={18} />
                                <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
                                    {query
                                        ? "No matching skills. Try a different search."
                                        : "Your skill library is empty. Create a skill to get started."}
                                </p>
                            </Card>
                        )}
                    </section>
                    <Card className="p-5 sm:p-6">
                        {open ? (
                            <form
                                className="space-y-5"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (!readonly) void save();
                                }}
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <h2 className="font-semibold">
                                        {readonly
                                            ? "Built-in skill"
                                            : selected
                                              ? "Edit skill"
                                              : "Create skill"}
                                    </h2>
                                    <Badge>
                                        {readonly ? "Read-only" : "Available to all profiles"}
                                    </Badge>
                                </div>
                                {readonly && (
                                    <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
                                        Built-in instructions cannot be changed. Make a personal
                                        copy to adapt them to your workflow.
                                    </p>
                                )}
                                <TextInput
                                    label="Skill name"
                                    required
                                    maxLength={100}
                                    readOnly={readonly}
                                    value={draft.name}
                                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                                    placeholder="e.g. Revision coach"
                                    hint="Use a short, descriptive name so it is easy to find in chat."
                                />
                                <Textarea
                                    label="Instructions"
                                    required
                                    maxLength={30000}
                                    rows={16}
                                    readOnly={readonly}
                                    value={draft.instructions}
                                    onChange={(e) =>
                                        setDraft({ ...draft, instructions: e.target.value })
                                    }
                                    placeholder="Explain when to use this skill, the steps to follow, and what a good result looks like…"
                                    className="font-mono text-xs leading-relaxed"
                                />
                                <div className="flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] pt-4">
                                    {readonly ? (
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                setSelected(null);
                                                setDraft({
                                                    ...draft,
                                                    name: `${draft.name} (copy)`.slice(0, 100),
                                                });
                                            }}
                                        >
                                            Make a personal copy
                                        </Button>
                                    ) : (
                                        <Button
                                            type="submit"
                                            size="sm"
                                            loading={saving}
                                            disabled={
                                                !draft.name.trim() || !draft.instructions.trim()
                                            }
                                        >
                                            Save skill
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        disabled={saving}
                                        onClick={() => {
                                            if (
                                                !dirty ||
                                                window.confirm("Discard your unsaved changes?")
                                            )
                                                setOpen(false);
                                        }}
                                    >
                                        {readonly ? "Close" : "Cancel"}
                                    </Button>
                                    {selected && !readonly && (
                                        <Button
                                            size="sm"
                                            variant="danger"
                                            disabled={saving}
                                            onClick={() => void remove()}
                                        >
                                            Delete skill
                                        </Button>
                                    )}
                                    <span className="ml-auto text-xs text-[var(--color-text-secondary)]">
                                        {draft.instructions.length.toLocaleString()} / 30,000
                                    </span>
                                </div>
                            </form>
                        ) : (
                            <div className="py-16 text-center">
                                <BookOpen
                                    size={28}
                                    className="mx-auto text-[var(--color-text-secondary)]"
                                />
                                <h2 className="mt-4 font-semibold">Build your AI toolkit</h2>
                                <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-[var(--color-text-secondary)]">
                                    Choose a skill to read or edit its instructions, or create your
                                    own. Attach skills as MUST READ in a profile without limiting
                                    their availability elsewhere.
                                </p>
                                <Button size="sm" className="mt-5" onClick={() => start()}>
                                    Create a skill
                                </Button>
                            </div>
                        )}
                    </Card>
                </div>
            )}
        </main>
    );
}
