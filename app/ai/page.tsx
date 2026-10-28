"use client";

import { Markdown } from "@/components/ai/Markdown";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { useAuth } from "@/context/authContext";
import {
    Sparkles,
    SlidersHorizontal,
    PanelRightClose,
    PanelRightOpen,
    Settings2,
} from "lucide-react";
import Link from "next/link";
import { Button, Select, Text, Textarea } from "@/components/ui/components";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Item = { id: string; name: string; context?: string; instructions?: string; system?: boolean };
type ChatSummary = { id: string; title?: string };

function asItems(value: unknown): Item[] {
    if (Array.isArray(value)) return value as Item[];
    if (!value || typeof value !== "object") return [];
    return Object.entries(value).map(([id, item]) => ({ id, ...(item as Omit<Item, "id">) }));
}

export default function AiPage() {
    const { token, loading } = useAuth();
    const headers = useMemo(() => ({ Authorization: `****** ?? ""}` }), [token]);
    const [chats, setChats] = useState<ChatSummary[]>([]);
    const [profiles, setProfiles] = useState<Item[]>([]);
    const [skills, setSkills] = useState<Item[]>([]);
    const [agents, setAgents] = useState<Item[]>([]);
    const [chatId, setChatId] = useState<string>();
    const [profileId, setProfileId] = useState("ai-choice");
    const [input, setInput] = useState("");
    const [railOpen, setRailOpen] = useState(true);
    const [loadingChat, setLoadingChat] = useState(false);
    const [workspaceError, setWorkspaceError] = useState<string>();
    const loadVersion = useRef(0);
    const bottom = useRef<HTMLDivElement>(null);
    const activeChat = useRef<string | undefined>(undefined);
    const { messages, sendMessage, setMessages, status, error, stop, regenerate, clearError } =
        useChat({
            transport: new DefaultChatTransport({ api: "/api/ai/chat", headers }),
            onFinish: () => {
                void loadWorkspace().catch((error: Error) => setWorkspaceError(error.message));
            },
        });

    const loadWorkspace = useCallback(async () => {
        const responses = await Promise.all([
            fetch("/api/ai/chats", { headers }),
            fetch("/api/ai/profiles", { headers }),
            fetch("/api/ai/skills", { headers }),
            fetch("/api/ai/agents", { headers }),
        ]);
        for (const response of responses) {
            if (!response.ok)
                throw new Error(
                    (await response.text()) || `Workspace request failed (${response.status})`,
                );
        }
        setWorkspaceError(undefined);
        if (responses[0].ok) setChats((await responses[0].json()).chats ?? []);
        if (responses[1].ok) setProfiles(asItems((await responses[1].json()).profiles));
        if (responses[2].ok) setSkills(asItems((await responses[2].json()).skills));
        if (responses[3].ok) setAgents(asItems((await responses[3].json()).agents));
    }, [headers]);

    useEffect(() => {
        if (!token) return;
        const timer = window.setTimeout(
            () => void loadWorkspace().catch((error: Error) => setWorkspaceError(error.message)),
            0,
        );
        return () => window.clearTimeout(timer);
    }, [loadWorkspace, token]);

    const openChat = async (id: string) => {
        const version = ++loadVersion.current;
        setLoadingChat(true);
        setWorkspaceError(undefined);
        try {
            const response = await fetch(`/api/ai/chats?id=${encodeURIComponent(id)}`, { headers });
            if (!response.ok)
                throw new Error((await response.text()) || "Could not load conversation");
            const data = await response.json();
            if (version !== loadVersion.current) return;
            activeChat.current = id;
            setChatId(id);
            setMessages(data.chat?.messages ?? []);
            setProfileId(data.chat?.profileId ?? "ai-choice");
            clearError();
        } catch (error) {
            if (version === loadVersion.current)
                setWorkspaceError(
                    error instanceof Error ? error.message : "Could not load conversation",
                );
        } finally {
            if (version === loadVersion.current) setLoadingChat(false);
        }
    };

    const newChat = () => {
        ++loadVersion.current;
        setLoadingChat(false);
        activeChat.current = undefined;
        setChatId(undefined);
        setMessages([]);
        clearError();
    };

    useEffect(() => {
        bottom.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, status]);

    const requestBody = (id: string) => ({
        chatId: id,
        profileId: profileId === "ai-choice" ? undefined : profileId,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    const send = () => {
        if (!input.trim() || loadingChat || (status !== "ready" && status !== "error")) return;
        const id = chatId ?? crypto.randomUUID();
        activeChat.current = id;
        setChatId(id);
        clearError();
        const skillMatch = input.trim().match(/^\/([^\s]+)\s*(.*)$/);
        const requestedSkill = skillMatch
            ? skills.find(
                  (skill) =>
                      skill.name.toLowerCase().replace(/\s+/g, "-") === skillMatch[1].toLowerCase(),
              )
            : undefined;
        const text = requestedSkill
            ? skillMatch?.[2] || `Use the ${requestedSkill.name} skill.`
            : input.trim();
        void sendMessage(
            { text },
            {
                body: {
                    ...requestBody(id),
                    skillId: requestedSkill?.id,
                },
            },
        );
        setInput("");
    };

    const insertAgentPrompt = () => {
        const prompt =
            "Create a system agent for me. Use the available tools, a suitable profile, and relevant skills. Define what it should do and how it should trigger actions. My requirements: ";
        if (
            input.trim() &&
            !window.confirm("Replace the current message with the system-agent prompt?")
        )
            return;
        setInput(prompt);
    };

    useEffect(() => {
        if (new URLSearchParams(window.location.search).get("agentPrompt") === "1") {
            const timer = window.setTimeout(
                () =>
                    setInput(
                        "Create a system agent for me. Use available tools, an appropriate profile and relevant skills. Clarify its triggers and permissions. My requirements:\n",
                    ),
                0,
            );
            return () => window.clearTimeout(timer);
        }
    }, []);

    if (loading) return <main className="p-6 text-sm">Loading...</main>;
    if (!token) return <main className="p-6 text-sm">Sign in to use the AI assistant.</main>;

    return (
        <main className="flex h-[calc(100dvh-2rem)] min-h-[540px] overflow-hidden bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)]">
            <section className="flex min-w-0 flex-1 flex-col">
                <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-10">
                    <div className="mx-auto max-w-3xl space-y-4">
                        {messages.length === 0 && (
                            <div className="mx-auto flex max-w-lg flex-col items-center py-10 text-center">
                                <div className="mb-5 rounded-2xl bg-[var(--color-primary)]/10 p-4">
                                    <Sparkles className="h-6 w-6 text-[var(--color-primary)]" />
                                </div>
                                <h2 className="text-xl font-medium">What are we working on?</h2>
                                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                                    Plan your week, untangle a topic, or turn your notes into
                                    something useful.
                                </p>
                                <div className="mt-7 grid w-full gap-3 sm:grid-cols-2">
                                    {[
                                        "Help me plan my study week",
                                        "Quiz me on a topic",
                                        "Break an assignment into steps",
                                        "Create a system agent",
                                    ].map((suggestion) => (
                                        <Button
                                            key={suggestion}
                                            variant="outline"
                                            size="sm"
                                            className="justify-start text-left"
                                            onClick={() => setInput(suggestion)}
                                        >
                                            {suggestion}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={
                                    message.role === "user"
                                        ? "ml-auto max-w-[85%] rounded-2xl bg-[var(--color-primary)]/10 px-4 py-3"
                                        : "max-w-full py-2"
                                }
                            >
                                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                                    {message.role === "user" ? "You" : "SchoolMate"}
                                </p>
                                {message.parts.map((part, index) =>
                                    part.type === "text" ? (
                                        <Markdown key={index}>{part.text}</Markdown>
                                    ) : part.type === "reasoning" ? (
                                        <details
                                            key={index}
                                            className="my-2 text-xs text-[var(--color-text-secondary)]"
                                        >
                                            <summary className="cursor-pointer">
                                                Provider reasoning
                                                {part.state === "streaming" ? " · streaming" : ""}
                                            </summary>
                                            <Markdown className="mt-2">{part.text}</Markdown>
                                        </details>
                                    ) : part.type === "dynamic-tool" ||
                                      part.type.startsWith("tool-") ? (
                                        <details
                                            key={index}
                                            className="my-2 rounded-lg border border-[var(--color-border-subtle)] p-2 text-xs"
                                        >
                                            <summary className="cursor-pointer">
                                                {"toolName" in part
                                                    ? String(part.toolName)
                                                    : part.type.slice(5)}{" "}
                                                ·{" "}
                                                {"state" in part
                                                    ? String(part.state).replaceAll("-", " ")
                                                    : "running"}
                                            </summary>
                                            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words">
                                                {JSON.stringify(part, null, 2)}
                                            </pre>
                                        </details>
                                    ) : null,
                                )}
                            </div>
                        ))}
                        {status === "submitted" && <Text variant="caption">Thinking…</Text>}
                        {loadingChat && <p role="status">Loading conversation…</p>}
                        {workspaceError && (
                            <div role="alert" className="text-red-600">
                                {workspaceError}
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                        void loadWorkspace().catch((error: Error) =>
                                            setWorkspaceError(error.message),
                                        )
                                    }
                                >
                                    Retry workspace
                                </Button>
                            </div>
                        )}
                        {error && (
                            <p role="alert" className="text-sm text-red-600">
                                {error.message}
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    disabled={loadingChat}
                                    onClick={() => {
                                        if (chatId) void regenerate({ body: requestBody(chatId) });
                                    }}
                                >
                                    Retry response
                                </Button>
                            </p>
                        )}
                        <div ref={bottom} />
                    </div>
                </div>
                <div className="mx-auto w-full max-w-4xl px-5 pb-5 sm:px-10">
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            send();
                        }}
                        className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised,var(--color-surface))] p-3 shadow-sm"
                    >
                        <Textarea
                            aria-label="Message SchoolMate"
                            placeholder="Ask anything about your schoolwork…"
                            rows={2}
                            disabled={loadingChat}
                            onKeyDown={(event) => {
                                if (
                                    event.key === "Enter" &&
                                    !event.shiftKey &&
                                    !event.nativeEvent.isComposing
                                ) {
                                    event.preventDefault();
                                    send();
                                }
                            }}
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            className="resize-none border-0 text-sm shadow-none"
                        />
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                            <details className="relative">
                                <summary className="cursor-pointer list-none rounded-md px-2 py-1.5 text-xs hover:bg-[var(--color-primary)]/5">
                                    Profile:{" "}
                                    <span className="font-medium">
                                        {profiles.find((profile) => profile.id === profileId)
                                            ?.name ?? "AI Choice"}
                                    </span>{" "}
                                    ▾
                                </summary>
                                <div className="absolute bottom-full left-0 z-20 mb-2 w-72 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-3 shadow-xl">
                                    <Select
                                        label="Conversation profile"
                                        hint="AI Choice lets the assistant choose the approach. A profile's attached skills must always be read."
                                        value={profileId}
                                        onChange={(event) => setProfileId(event.target.value)}
                                        options={[
                                            {
                                                value: "ai-choice",
                                                label: "AI Choice — choose for me",
                                            },
                                            ...profiles.map((profile) => ({
                                                value: profile.id,
                                                label: profile.name,
                                            })),
                                        ]}
                                    />
                                    <Link
                                        href="/ai/profiles"
                                        className="mt-3 flex items-center gap-2 text-xs text-[var(--color-primary)]"
                                    >
                                        <Settings2 className="h-3.5 w-3.5" />
                                        Manage profiles & required skills
                                    </Link>
                                </div>
                            </details>
                            <Link
                                href="/ai/skills"
                                className="mr-auto flex items-center gap-1 text-xs text-[var(--color-text-secondary)]"
                            >
                                <SlidersHorizontal className="h-3.5 w-3.5" />
                                Skills
                            </Link>
                            {status === "streaming" || status === "submitted" ? (
                                <Button size="sm" type="button" onClick={() => void stop()}>
                                    Stop
                                </Button>
                            ) : (
                                <Button
                                    size="sm"
                                    disabled={
                                        loadingChat ||
                                        !input.trim() ||
                                        status === "streaming" ||
                                        status === "submitted"
                                    }
                                    type="submit"
                                >
                                    Send
                                </Button>
                            )}
                        </div>
                    </form>
                    <p className="mt-2 text-center text-[10px] text-[var(--color-text-secondary)]">
                        All skills are available. Use /tasks or /study-materials to request one
                        directly.
                    </p>
                </div>
            </section>
            <aside
                className={
                    (railOpen ? "w-64" : "w-12") +
                    " flex shrink-0 flex-col border-l border-[var(--color-border-subtle)] transition-[width]"
                }
            >
                <div className="flex items-center justify-between p-3">
                    {railOpen && (
                        <Link
                            href="/settings/ai"
                            className="text-xs text-[var(--color-text-secondary)]"
                        >
                            AI settings
                        </Link>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        aria-label={railOpen ? "Collapse sidebar" : "Expand sidebar"}
                        leftIcon={
                            railOpen ? (
                                <PanelRightClose className="h-4 w-4" />
                            ) : (
                                <PanelRightOpen className="h-4 w-4" />
                            )
                        }
                        onClick={() => setRailOpen(!railOpen)}
                    />
                </div>
                {railOpen && (
                    <>
                        <div className="px-3 pb-3">
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                disabled={status === "streaming" || status === "submitted"}
                                onClick={newChat}
                            >
                                + Create chat
                            </Button>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto px-3">
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                                Recent conversations
                            </p>
                            {chats.length === 0 && (
                                <p className="text-xs text-[var(--color-text-secondary)]">
                                    Your conversations will appear here.
                                </p>
                            )}
                            {chats.map((chat) => (
                                <Button
                                    key={chat.id}
                                    variant="ghost"
                                    size="sm"
                                    className="mb-1 w-full justify-start truncate"
                                    disabled={
                                        loadingChat ||
                                        status === "streaming" ||
                                        status === "submitted"
                                    }
                                    aria-current={chatId === chat.id ? "page" : undefined}
                                    onClick={() => void openChat(chat.id)}
                                >
                                    {chat.title || "New chat"}
                                </Button>
                            ))}
                        </div>
                        <div className="max-h-[45%] shrink-0 overflow-y-auto border-t border-[var(--color-border-subtle)] p-3">
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                                System agents
                            </p>
                            {agents.map((agent) => (
                                <Link
                                    key={agent.id}
                                    href={"/ai/agents/" + agent.id}
                                    className="mb-1 block rounded-md px-2 py-2 text-xs hover:bg-[var(--color-primary)]/5"
                                >
                                    {agent.name}
                                </Link>
                            ))}
                            <div className="mt-2 flex items-center gap-2">
                                <Link
                                    href="/ai/agents/new"
                                    className="flex-1 rounded-md border border-[var(--color-border-subtle)] px-3 py-2 text-xs"
                                >
                                    + Create system agent
                                </Link>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    iconOnly
                                    aria-label="Draft a system agent with AI"
                                    title="Describe an agent in chat"
                                    leftIcon={<Sparkles className="h-4 w-4" />}
                                    onClick={insertAgentPrompt}
                                />
                            </div>
                            <p className="mt-2 text-[10px] text-[var(--color-text-secondary)]">
                                Automations run while this app is open.
                            </p>
                        </div>
                    </>
                )}
            </aside>
        </main>
    );
}
