"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useAuth } from "@/context/authContext";
import { Button } from "@/components/ui/components";

type Agent = {
    id: string;
    name: string;
    instructions: string;
    lastRunAt?: number;
    lastOutput?: string;
    lastError?: string;
};

export default function AgentWorkspacePage() {
    const { id } = useParams<{ id: string }>();
    const { token, loading } = useAuth();
    const headers = useMemo(() => ({ Authorization: `Bearer ${token ?? ""}` }), [token]);
    const [agent, setAgent] = useState<Agent>();
    const [loadError, setLoadError] = useState("");
    const [input, setInput] = useState("");
    const { messages, sendMessage, status, error } = useChat({
        transport: new DefaultChatTransport({
            api: "/api/ai/chat",
            headers,
            body: { agentId: id },
        }),
    });
    useEffect(() => {
        if (!token) return;
        let active = true;
        void fetch("/api/ai/agents", { headers })
            .then(async (response) => {
                if (!response.ok) throw new Error("Unable to load agent");
                const found = (await response.json()).agents.find((item: Agent) => item.id === id);
                if (!found) throw new Error("Agent not found");
                if (active) setAgent(found);
            })
            .catch((error) => {
                if (active) setLoadError(error.message);
            });
        return () => {
            active = false;
        };
    }, [headers, id, token]);
    if (loading) return <main className="p-6">Loading...</main>;
    if (!token) return <main className="p-6">Sign in to open this agent.</main>;
    return (
        <main className="mx-auto max-w-3xl px-6 py-8 text-sm">
            <Link href="/ai" className="text-indigo-600">
                ← Back to AI
            </Link>
            <h2 className="mt-4 text-2xl font-semibold">{agent?.name ?? "Agent workspace"}</h2>
            <p className="mt-2 text-slate-500">{agent?.instructions}</p>
            {loadError && <p role="alert">{loadError}</p>}
            {agent?.lastRunAt && (
                <p className="mt-3">
                    Last automatic run: {new Date(agent.lastRunAt).toLocaleString()}
                </p>
            )}
            {agent?.lastError && (
                <p role="alert" className="text-red-600">
                    {agent.lastError}
                </p>
            )}
            {agent?.lastOutput && (
                <section className="mt-4 whitespace-pre-wrap rounded border p-4">
                    <h3 className="font-semibold">Latest automatic result</h3>
                    {agent.lastOutput}
                </section>
            )}
            <div className="my-5 space-y-3" aria-live="polite">
                {messages.map((message) => (
                    <div key={message.id} className="whitespace-pre-wrap rounded border p-3">
                        <strong>{message.role === "user" ? "You" : agent?.name}</strong>
                        {message.parts.map((part, index) =>
                            part.type === "text" ? <p key={index}>{part.text}</p> : null,
                        )}
                    </div>
                ))}
            </div>
            {error && (
                <p role="alert" className="text-red-600">
                    {error.message}
                </p>
            )}
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    if (!input.trim() || !agent) return;
                    void sendMessage({ text: input });
                    setInput("");
                }}
            >
                <label htmlFor="agent-message">Message this agent</label>
                <textarea
                    id="agent-message"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    className="my-2 w-full rounded border p-3"
                    rows={3}
                />
                <Button
                    type="submit"
                    disabled={
                        !agent || !input.trim() || status === "streaming" || status === "submitted"
                    }
                >
                    Send
                </Button>
            </form>
            <p className="mt-3 text-xs text-slate-500">
                Manual conversation lasts for this visit. Automatic runs persist their latest
                result. Triggers run only while the app is open.
            </p>
        </main>
    );
}
