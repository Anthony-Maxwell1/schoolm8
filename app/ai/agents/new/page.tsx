"use client";

import Link from "next/link";
import { useAuth } from "@/context/authContext";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Item = { id: string; name: string };

export default function NewAgentPage() {
    const { token, loading } = useAuth();
    const router = useRouter();
    const headers = useMemo(() => ({ Authorization: `Bearer ${token ?? ""}` }), [token]);
    const [profiles, setProfiles] = useState<Item[]>([]);
    const [trigger, setTrigger] = useState("manual");
    const [intervalMinutes, setIntervalMinutes] = useState(60);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState("");
    const [instructions, setInstructions] = useState("");
    const [profileIds, setProfileIds] = useState<string[]>([]);

    useEffect(() => {
        if (!token) return;
        void fetch("/api/ai/profiles", { headers })
            .then(async (response) => {
                if (!response.ok) throw new Error("Unable to load profiles");
                setProfiles((await response.json()).profiles ?? []);
            })
            .catch((error) => setError(error.message));
    }, [headers, token]);
    const save = async () => {
        setSaving(true);
        setError("");
        try {
            const response = await fetch("/api/ai/agents", {
                method: "POST",
                headers: { ...headers, "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    instructions,
                    profileIds,
                    trigger: { type: trigger, intervalMinutes },
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Unable to create agent");
            router.push(`/ai/agents/${data.id}`);
        } catch (error) {
            setError(error instanceof Error ? error.message : "Unable to create agent");
        } finally {
            setSaving(false);
        }
    };
    if (loading) return <main className="p-6 text-sm">Loading...</main>;
    if (!token) return <main className="p-6 text-sm">Sign in to create an agent.</main>;
    return (
        <main className="mx-auto max-w-2xl px-6 py-8 text-sm">
            <Link href="/ai" className="text-xs text-indigo-600">
                ← Back to AI
            </Link>
            <div className="mt-4 flex items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold">Create system agent</h2>
                <Link href="/ai?agentPrompt=1" className="text-indigo-600">
                    Do it for me
                </Link>
            </div>
            <p className="mt-1 text-xs text-slate-500">
                Define an agent that can run a focused workspace and use your selected context.
            </p>
            <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Agent name"
                className="mt-6 w-full rounded-md border px-3 py-2"
            />
            <textarea
                value={instructions}
                onChange={(event) => setInstructions(event.target.value)}
                placeholder="What should this agent do?"
                rows={6}
                className="mt-2 w-full rounded-md border px-3 py-2"
            />
            <h3 className="mt-5 font-medium">Profiles</h3>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {profiles.map((profile) => (
                    <label key={profile.id} className="flex gap-2 rounded border p-2 text-xs">
                        <input
                            type="checkbox"
                            checked={profileIds.includes(profile.id)}
                            onChange={(event) =>
                                setProfileIds(
                                    event.target.checked
                                        ? [...profileIds, profile.id]
                                        : profileIds.filter((id) => id !== profile.id),
                                )
                            }
                        />
                        {profile.name}
                    </label>
                ))}
            </div>
            <p className="mt-4 text-xs">
                All skills are available globally. Attached profile skills are mandatory.
            </p>
            <label className="mt-5 block">
                Trigger
                <select
                    value={trigger}
                    onChange={(event) => setTrigger(event.target.value)}
                    className="ml-3 rounded border p-2"
                >
                    <option value="manual">Manual only</option>
                    <option value="interval">Time interval</option>
                    <option value="assignment">New assignment</option>
                </select>
            </label>
            {trigger === "interval" && (
                <label className="mt-3 block">
                    Interval (minutes, minimum 5)
                    <input
                        type="number"
                        min={5}
                        max={10080}
                        value={intervalMinutes}
                        onChange={(event) => setIntervalMinutes(Number(event.target.value))}
                        className="ml-3 w-24 rounded border p-2"
                    />
                </label>
            )}
            <p className="mt-3 text-xs text-slate-500">
                Triggers run only while the app is open. Existing assignments establish a baseline;
                missed intervals are not replayed.
            </p>
            {error && (
                <p role="alert" className="mt-3 text-red-600">
                    {error}
                </p>
            )}
            <button
                disabled={saving || !name.trim() || !instructions.trim()}
                onClick={() => void save()}
                className="mt-6 rounded-md bg-indigo-600 px-4 py-2 text-xs font-medium text-white"
            >
                Create agent
            </button>
        </main>
    );
}
