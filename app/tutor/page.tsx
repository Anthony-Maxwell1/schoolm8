"use client";

/**
 * /tutor — AI Tutor
 *
 * A streaming chat grounded in the student's synced Canvas data. Includes
 * conversation history, suggested prompts, and the ability to attach a specific
 * assignment so the tutor gets its full description + rubric.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
    Bot,
    Plus,
    Send,
    Paperclip,
    Trash2,
    X,
    MessageSquare,
    Sparkles,
    PanelLeftClose,
    PanelLeftOpen,
} from "lucide-react";
import {
    Button,
    Spinner,
    Modal,
    SearchInput,
    Badge,
    Chip,
    EmptyState,
} from "@/components/ui/components";
import { Markdown } from "@/components/ai/Markdown";
import { ConnectGeminiCTA } from "@/components/ai/ConnectGeminiCTA";
import { useAuth } from "@/context/authContext";

interface Msg {
    role: "user" | "model";
    content: string;
    attachedTitle?: string;
}
interface ConvSummary {
    id: string;
    title: string;
    updatedAt: string;
    messageCount: number;
}
interface AssignmentLite {
    id: string;
    title: string;
    courseName: string;
    dueAt?: string | null;
}

const SUGGESTIONS = [
    "What's due this week?",
    "Help me prioritise my overdue work",
    "Explain my hardest upcoming assignment",
    "Quiz me on a topic from my courses",
];

export default function TutorPage() {
    const { token, loading: authLoading } = useAuth();

    const [bootLoading, setBootLoading] = useState(true);
    const [needsKey, setNeedsKey] = useState(false);
    const [keyInvalid, setKeyInvalid] = useState(false);

    const [conversations, setConversations] = useState<ConvSummary[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Msg[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const [attachOpen, setAttachOpen] = useState(false);
    const [assignments, setAssignments] = useState<AssignmentLite[]>([]);
    const [assignmentsLoading, setAssignmentsLoading] = useState(false);
    const [assignmentQuery, setAssignmentQuery] = useState("");
    const [attached, setAttached] = useState<AssignmentLite | null>(null);

    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // ── Bootstrap: key status + conversations ──────────────────────────────
    const loadConversations = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch("/api/ai/conversations", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setConversations(data.conversations ?? []);
            }
        } catch {
            /* non-fatal */
        }
    }, [token]);

    useEffect(() => {
        if (authLoading || !token) return;
        let cancelled = false;
        (async () => {
            setBootLoading(true);
            try {
                const res = await fetch("/api/ai/key", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (cancelled) return;
                if (!data.hasKey) setNeedsKey(true);
                else if (data.keyStatus === "invalid") setKeyInvalid(true);
            } catch {
                /* ignore */
            } finally {
                await loadConversations();
                if (!cancelled) setBootLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [authLoading, token, loadConversations]);

    // Auto-scroll to the newest content.
    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, [messages]);

    const openConversation = async (id: string) => {
        if (!token || id === activeId) return;
        try {
            const res = await fetch(`/api/ai/conversations/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Could not open conversation");
            const data = await res.json();
            setActiveId(id);
            setMessages(
                (data.conversation.messages ?? []).map((m: { role: "user" | "model"; content: string }) => ({
                    role: m.role,
                    content: m.content,
                })),
            );
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to open chat");
        }
    };

    const newChat = () => {
        setActiveId(null);
        setMessages([]);
        setAttached(null);
        inputRef.current?.focus();
    };

    const deleteConversation = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!token) return;
        try {
            await fetch(`/api/ai/conversations/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            setConversations((prev) => prev.filter((c) => c.id !== id));
            if (id === activeId) newChat();
        } catch {
            toast.error("Could not delete chat");
        }
    };

    const loadAssignments = async () => {
        if (!token) return;
        setAssignmentsLoading(true);
        try {
            const res = await fetch("/api/lms/assignments", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            const list = Object.values(data.assignments ?? {}) as AssignmentLite[];
            list.sort((a, b) => {
                const ta = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
                const tb = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
                return ta - tb;
            });
            setAssignments(list);
        } catch {
            toast.error("Could not load assignments");
        } finally {
            setAssignmentsLoading(false);
        }
    };

    const openAttach = () => {
        setAttachOpen(true);
        if (assignments.length === 0) loadAssignments();
    };

    // ── Send + stream ──────────────────────────────────────────────────────
    const send = async (textOverride?: string) => {
        const text = (textOverride ?? input).trim();
        if (!text || sending || !token) return;

        const attachedForThis = attached;
        setInput("");
        setAttached(null);
        setSending(true);

        setMessages((prev) => [
            ...prev,
            { role: "user", content: text, attachedTitle: attachedForThis?.title },
            { role: "model", content: "" },
        ]);

        try {
            const res = await fetch("/api/ai/tutor", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: text,
                    conversationId: activeId ?? undefined,
                    attachedAssignmentId: attachedForThis?.id,
                }),
            });

            if (res.status === 409) {
                setNeedsKey(true);
                setMessages((prev) => prev.slice(0, -2));
                return;
            }
            if (!res.ok || !res.body) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error ?? "The tutor could not respond");
            }

            const convId = res.headers.get("X-Conversation-Id");
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let acc = "";

            for (;;) {
                const { done, value } = await reader.read();
                if (done) break;
                acc += decoder.decode(value, { stream: true });
                setMessages((prev) => {
                    const next = [...prev];
                    next[next.length - 1] = { role: "model", content: acc };
                    return next;
                });
            }

            if (convId && convId !== activeId) setActiveId(convId);
            loadConversations();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "The tutor could not respond");
            // Drop the empty assistant placeholder on failure.
            setMessages((prev) => {
                const next = [...prev];
                if (next[next.length - 1]?.content === "") next.pop();
                return next;
            });
        } finally {
            setSending(false);
        }
    };

    const onInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    const filteredAssignments = assignments.filter(
        (a) =>
            a.title?.toLowerCase().includes(assignmentQuery.toLowerCase()) ||
            a.courseName?.toLowerCase().includes(assignmentQuery.toLowerCase()),
    );

    // ── Render ─────────────────────────────────────────────────────────────
    if (authLoading || bootLoading) {
        return (
            <div className="flex h-[100dvh] items-center justify-center bg-[var(--color-surface)] text-[var(--color-text-secondary)]">
                <Spinner size="lg" />
            </div>
        );
    }

    if (needsKey || keyInvalid) {
        return (
            <div className="flex h-[100dvh] items-center justify-center bg-[var(--color-surface)] px-6">
                <div className="w-full max-w-md">
                    <ConnectGeminiCTA feature="the AI tutor" invalid={keyInvalid} />
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-[100dvh] bg-[var(--color-surface)]">
            {/* History sidebar */}
            {sidebarOpen && (
                <aside className="flex w-64 shrink-0 flex-col border-r border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]">
                    <div className="flex items-center justify-between p-3">
                        <span className="font-[family-name:var(--font-display)] text-lg text-[var(--color-text-primary)]">
                            Chats
                        </span>
                        <Button
                            size="sm"
                            variant="ghost"
                            iconOnly
                            leftIcon={<Plus className="h-4 w-4" />}
                            onClick={newChat}
                            aria-label="New chat"
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto px-2 pb-3">
                        {conversations.length === 0 ? (
                            <p className="px-2 py-4 text-sm text-[var(--color-text-tertiary)]">
                                No chats yet. Ask something below to get started.
                            </p>
                        ) : (
                            conversations.map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => openConversation(c.id)}
                                    className={`group mb-1 flex w-full items-center gap-2 rounded-[var(--radius-md)] px-2.5 py-2 text-left text-sm transition-colors ${
                                        c.id === activeId
                                            ? "bg-[var(--color-accent-subtle)] text-[var(--color-text-primary)]"
                                            : "text-[var(--color-text-secondary)] hover:bg-[var(--color-muted)]"
                                    }`}
                                >
                                    <MessageSquare className="h-4 w-4 shrink-0 opacity-60" />
                                    <span className="flex-1 truncate">{c.title}</span>
                                    <span
                                        role="button"
                                        tabIndex={0}
                                        onClick={(e) => deleteConversation(c.id, e)}
                                        className="opacity-0 transition-opacity group-hover:opacity-100"
                                        aria-label="Delete chat"
                                    >
                                        <Trash2 className="h-3.5 w-3.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-danger)]" />
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                </aside>
            )}

            {/* Chat column */}
            <div className="flex min-w-0 flex-1 flex-col">
                {/* Header */}
                <header className="flex items-center gap-3 border-b border-[var(--color-border-subtle)] px-4 py-3">
                    <Button
                        size="sm"
                        variant="ghost"
                        iconOnly
                        leftIcon={
                            sidebarOpen ? (
                                <PanelLeftClose className="h-4 w-4" />
                            ) : (
                                <PanelLeftOpen className="h-4 w-4" />
                            )
                        }
                        onClick={() => setSidebarOpen((o) => !o)}
                        aria-label="Toggle history"
                    />
                    <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-subtle)] text-[var(--color-primary)]">
                        <Bot className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                        <p className="truncate font-medium text-[var(--color-text-primary)]">
                            AI Tutor
                        </p>
                        <p className="truncate text-xs text-[var(--color-text-tertiary)]">
                            Grounded in your Canvas courses &amp; deadlines
                        </p>
                    </div>
                </header>

                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto">
                    <div className="mx-auto max-w-3xl px-4 py-6">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center pt-12 text-center">
                                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[var(--radius-xl)] bg-[var(--color-accent-subtle)] text-[var(--color-primary)]">
                                    <Sparkles className="h-7 w-7" />
                                </div>
                                <h2 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-text-primary)]">
                                    How can I help you study?
                                </h2>
                                <p className="mt-2 max-w-md text-[var(--color-text-secondary)]">
                                    I already know your courses, assignments, and deadlines. Ask me
                                    anything, or try one of these:
                                </p>
                                <div className="mt-6 grid w-full max-w-lg gap-2 sm:grid-cols-2">
                                    {SUGGESTIONS.map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => send(s)}
                                            className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] px-4 py-3 text-left text-sm text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-muted)]"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {messages.map((m, i) => (
                                    <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
                                        {m.role === "user" ? (
                                            <div className="max-w-[85%]">
                                                {m.attachedTitle && (
                                                    <div className="mb-1 flex justify-end">
                                                        <Badge variant="info">
                                                            <Paperclip className="mr-1 inline h-3 w-3" />
                                                            {m.attachedTitle}
                                                        </Badge>
                                                    </div>
                                                )}
                                                <div className="rounded-[var(--radius-lg)] rounded-tr-sm bg-[var(--color-primary)] px-4 py-2.5 text-[var(--color-on-primary)]">
                                                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                                                        {m.content}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex gap-3">
                                                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-subtle)] text-[var(--color-primary)]">
                                                    <Bot className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0 flex-1 pt-0.5">
                                                    {m.content === "" && sending ? (
                                                        <div className="flex items-center gap-2 text-[var(--color-text-tertiary)]">
                                                            <Spinner size="sm" />
                                                            <span className="text-sm">Thinking…</span>
                                                        </div>
                                                    ) : (
                                                        <Markdown>{m.content}</Markdown>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Composer */}
                <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-4 py-3">
                    <div className="mx-auto max-w-3xl">
                        {attached && (
                            <div className="mb-2">
                                <Chip onRemove={() => setAttached(null)}>
                                    <Paperclip className="mr-1 inline h-3 w-3" />
                                    {attached.title}
                                </Chip>
                            </div>
                        )}
                        <div className="flex items-end gap-2 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-2 focus-within:border-[var(--color-border-strong)]">
                            <Button
                                size="sm"
                                variant="ghost"
                                iconOnly
                                leftIcon={<Paperclip className="h-4 w-4" />}
                                onClick={openAttach}
                                aria-label="Attach an assignment"
                            />
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={onInputKeyDown}
                                rows={1}
                                placeholder="Ask your tutor anything…"
                                className="max-h-40 flex-1 resize-none bg-transparent px-1 py-1.5 text-[15px] text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)]"
                            />
                            <Button
                                iconOnly
                                leftIcon={<Send className="h-4 w-4" />}
                                onClick={() => send()}
                                loading={sending}
                                disabled={!input.trim()}
                                aria-label="Send message"
                            />
                        </div>
                        <p className="mt-1.5 text-center text-xs text-[var(--color-text-tertiary)]">
                            The tutor can make mistakes — always double-check important facts.
                        </p>
                    </div>
                </div>
            </div>

            {/* Attach assignment modal */}
            <Modal
                open={attachOpen}
                onClose={() => setAttachOpen(false)}
                title="Attach an assignment"
                description="The tutor will get this assignment's full description and rubric."
            >
                <div className="mb-3">
                    <SearchInput
                        value={assignmentQuery}
                        onChange={(e) => setAssignmentQuery(e.target.value)}
                        onClear={() => setAssignmentQuery("")}
                        placeholder="Search assignments…"
                    />
                </div>
                <div className="max-h-80 overflow-y-auto">
                    {assignmentsLoading ? (
                        <div className="flex items-center gap-2 py-6 text-[var(--color-text-secondary)]">
                            <Spinner size="sm" /> Loading assignments…
                        </div>
                    ) : filteredAssignments.length === 0 ? (
                        <EmptyState
                            title="No assignments found"
                            description="Sync Canvas in Settings → Integrations to see your work here."
                        />
                    ) : (
                        filteredAssignments.slice(0, 100).map((a) => (
                            <button
                                key={a.id}
                                onClick={() => {
                                    setAttached(a);
                                    setAttachOpen(false);
                                    inputRef.current?.focus();
                                }}
                                className="flex w-full flex-col items-start rounded-[var(--radius-md)] px-3 py-2.5 text-left transition-colors hover:bg-[var(--color-muted)]"
                            >
                                <span className="font-medium text-[var(--color-text-primary)]">
                                    {a.title}
                                </span>
                                <span className="text-xs text-[var(--color-text-tertiary)]">
                                    {a.courseName}
                                    {a.dueAt
                                        ? ` · due ${new Date(a.dueAt).toLocaleDateString()}`
                                        : ""}
                                </span>
                            </button>
                        ))
                    )}
                </div>
            </Modal>
        </div>
    );
}
