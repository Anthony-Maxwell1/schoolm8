"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/authContext";

/** Polls only while mounted; server transactions deduplicate execution across tabs. */
export default function AgentTriggers() {
    const { token } = useAuth();
    const [error, setError] = useState("");
    useEffect(() => {
        if (!token) return;
        let stopped = false;
        let busy = false;
        const controller = new AbortController();
        const check = async () => {
            if (busy || stopped || document.visibilityState !== "visible") return;
            busy = true;
            const headers = { Authorization: `Bearer ${token}` };
            try {
                const response = await fetch("/api/ai/agents", {
                    headers,
                    signal: controller.signal,
                });
                if (!response.ok) throw new Error("Unable to check agent triggers");
                const data = await response.json();
                const agents = (data.agents ?? [])
                    .filter(
                        (agent: { trigger?: { type: string } }) =>
                            agent.trigger && agent.trigger.type !== "manual",
                    )
                    .slice(0, 10);
                for (const agent of agents) {
                    if (stopped) break;
                    const result = await fetch("/api/ai/agents/run", {
                        method: "POST",
                        headers: { ...headers, "Content-Type": "application/json" },
                        body: JSON.stringify({ agentId: agent.id }),
                        signal: controller.signal,
                    });
                    if (!result.ok)
                        throw new Error((await result.json()).error || "Agent trigger failed");
                }
                if (!stopped) setError("");
            } catch (error) {
                if (!stopped)
                    setError(error instanceof Error ? error.message : "Agent trigger failed");
            } finally {
                busy = false;
            }
        };
        void check();
        const timer = window.setInterval(() => void check(), 60000);
        return () => {
            stopped = true;
            controller.abort();
            window.clearInterval(timer);
        };
    }, [token]);
    return error ? (
        <p
            role="alert"
            className="fixed bottom-4 right-4 z-50 max-w-sm rounded border bg-white p-3 text-xs text-red-700"
        >
            Agent triggers: {error}. Check your AI settings or agent workspace.
        </p>
    ) : null;
}
