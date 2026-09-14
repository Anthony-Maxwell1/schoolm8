"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, EmailAuthProvider, reauthenticateWithPopup, reauthenticateWithCredential } from "firebase/auth";
import { KeyRound, Plus, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { auth } from "@/lib/firebaseClient";
import { useAuth } from "@/context/authContext";
import apiFetch from "@/lib/fetch";

type App = { appId: string; name: string; logoUrl?: string };
type Client = { clientId: string; appId?: string; name: string; redirectUris: string[]; scopes: string[]; authMethod: string };

export default function DevelopersPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [enabled, setEnabled] = useState<boolean | null>(null);
    const [apps, setApps] = useState<App[]>([]);
    const [clients, setClients] = useState<Record<string, Client[]>>({});
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [newSecret, setNewSecret] = useState<{ clientId: string; secret: string } | null>(null);
    const [showCreateApp, setShowCreateApp] = useState(false);

    const loadApps = async () => {
        const data = await apiFetch("/api/developers/apps");
        setApps(data.apps);
    };

    useEffect(() => {
        if (loading) return;
        if (!user) { router.replace("/auth"); return; }
        apiFetch("/api/developers/account").then((data) => {
            setEnabled(data.enabled);
            if (data.enabled) loadApps().catch((err) => setError(err.message));
        }).catch((err) => setError(err.message));
    }, [loading, user, router]);

    const becomeDeveloper = async () => {
        setBusy(true); setError("");
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error("Please sign in again.");
            await apiFetch("/api/developers/account", { method: "POST" });
            setEnabled(true);
            await loadApps();
        } catch (err) { setError(err instanceof Error ? err.message : "Could not enable developer access"); }
        finally { setBusy(false); }
    };

    const createApp = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault(); setBusy(true); setError("");
        const form = new FormData(event.currentTarget);
        try { await apiFetch("/api/developers/apps", { method: "POST", body: JSON.stringify({ name: form.get("name") }), headers: { "Content-Type": "application/json" } }); setShowCreateApp(false); await loadApps(); }
        catch (err) { setError(err instanceof Error ? err.message : "Could not create app"); }
        finally { setBusy(false); }
    };

    const loadClients = async (appId: string) => {
        try { const data = await apiFetch(`/api/developers/apps/${appId}/clients`); setClients((current) => ({ ...current, [appId]: data.clients })); }
        catch (err) { setError(err instanceof Error ? err.message : "Could not load clients"); }
    };

    const createClient = async (event: FormEvent<HTMLFormElement>, appId: string) => {
        event.preventDefault(); setBusy(true); setError("");
        const form = new FormData(event.currentTarget);
        try {
            const result = await apiFetch(`/api/developers/apps/${appId}/clients`, { method: "POST", body: JSON.stringify({ name: form.get("name"), redirectUris: [form.get("redirectUri")], scopes: [] }), headers: { "Content-Type": "application/json" } });
            setNewSecret(result.clientSecret ? { clientId: result.clientId, secret: result.clientSecret } : null);
            event.currentTarget.reset(); await loadClients(appId);
        } catch (err) { setError(err instanceof Error ? err.message : "Could not create client"); }
        finally { setBusy(false); }
    };

    const reroll = async (clientId: string) => {
        setBusy(true); setError("");
        try { const result = await apiFetch(`/api/developers/clients/${clientId}`, { method: "POST" }); setNewSecret({ clientId, secret: result.clientSecret }); }
        catch (err) { setError(err instanceof Error ? err.message : "Could not reroll secret"); }
        finally { setBusy(false); }
    };

    const remove = async (url: string, after: () => Promise<void>) => {
        if (!window.confirm("Delete this permanently?")) return;
        setBusy(true); try { await apiFetch(url, { method: "DELETE" }); await after(); } catch (err) { setError(err instanceof Error ? err.message : "Delete failed"); } finally { setBusy(false); }
    };

    if (loading || enabled === null) return <main className="min-h-screen bg-[#fffaf2] p-8 text-[#33251d]">Loading developer workspace...</main>;

    return <main className="min-h-screen bg-[#fffaf2] text-[#33251d]">
        <header className="border-b border-[#eadfce] bg-white px-6 py-5 md:px-12">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-6">
                <div className="flex items-baseline gap-2 text-xl font-bold tracking-tight"><span>schoolm8</span><span className="text-[#d97722]">developers</span></div>
                <nav className="flex gap-5 text-sm font-medium"><a className="text-[#d97722]" href="#applications">Applications</a><a className="text-[#806f60]" href="#account">Account</a></nav>
            </div>
        </header>
        <div className="mx-auto max-w-6xl px-6 py-12 md:px-12">
            <div className="mb-10"><p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#d97722]">Developer workspace</p><h1 className="font-[var(--font-display)] text-5xl leading-none md:text-7xl">Build on schoolm8.</h1><p className="mt-5 max-w-xl text-lg text-[#806f60]">Manage application identities and the credentials your integrations use to connect.</p></div>
            {error && <div className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            {!enabled ? <section id="account" className="max-w-2xl border border-[#eadfce] bg-white p-8 shadow-[0_12px_40px_rgba(74,48,25,0.07)]"><ShieldCheck className="mb-6 text-[#d97722]" size={28} /><h2 className="text-2xl font-semibold">Activate your developer account</h2><p className="mt-3 text-[#806f60]">Confirm your identity to unlock application management. We may ask you to sign in again when your last authentication is more than five minutes old.</p><button disabled={busy} onClick={becomeDeveloper} className="mt-7 inline-flex items-center gap-2 bg-[#d97722] px-5 py-3 font-semibold text-white hover:bg-[#b85e14] disabled:opacity-50"><ShieldCheck size={17} /> Enable developer access</button></section> : <section id="applications">
                <div className="mb-5 flex items-end justify-between gap-4"><div><h2 className="text-3xl font-semibold">Applications</h2><p className="mt-1 text-[#806f60]">Each application can have one or more OAuth clients.</p></div><button onClick={() => setShowCreateApp(true)} className="inline-flex items-center gap-2 bg-[#d97722] px-4 py-3 font-semibold text-white hover:bg-[#b85e14]"><Plus size={17} /> New application</button></div>
                {showCreateApp && <form onSubmit={createApp} className="mb-6 flex max-w-xl gap-3 border border-[#eadfce] bg-white p-5"><input name="name" required placeholder="Application name" className="min-w-0 flex-1 border border-[#d9cbb9] px-3 py-2 outline-none focus:border-[#d97722]" /><button disabled={busy} className="bg-[#33251d] px-4 py-2 font-semibold text-white">Create</button></form>}
                <div className="grid gap-5 md:grid-cols-2">{apps.map((app) => <article key={app.appId} className="border border-[#eadfce] bg-white p-6"><div className="flex justify-between gap-4"><div><h3 className="text-xl font-semibold">{app.name}</h3><p className="mt-1 font-mono text-xs text-[#a28f7b]">{app.appId}</p></div><button title="Delete application" onClick={() => remove(`/api/developers/apps/${app.appId}`, async () => { setApps((all) => all.filter((item) => item.appId !== app.appId)); })} className="text-[#a28f7b] hover:text-red-600"><Trash2 size={18} /></button></div><button onClick={() => loadClients(app.appId)} className="mt-6 text-sm font-semibold text-[#d97722]">{clients[app.appId] ? "Refresh clients" : "Show clients"}</button>{clients[app.appId] && <div className="mt-4 border-t border-[#f0e7dc] pt-4"><div className="space-y-3">{clients[app.appId].map((client) => <div key={client.clientId} className="flex items-center justify-between gap-3 text-sm"><div><p className="font-semibold">{client.name}</p><p className="font-mono text-xs text-[#a28f7b]">{client.clientId}</p></div><div className="flex gap-2"><button title="Reroll secret" onClick={() => reroll(client.clientId)} className="text-[#d97722]"><RefreshCw size={16} /></button><button title="Delete client" onClick={() => remove(`/api/developers/clients/${client.clientId}`, () => loadClients(app.appId))} className="text-[#a28f7b] hover:text-red-600"><Trash2 size={16} /></button></div></div>)}</div><form onSubmit={(event) => createClient(event, app.appId)} className="mt-5 space-y-2"><input name="name" required placeholder="Client name" className="w-full border border-[#d9cbb9] px-3 py-2 text-sm" /><input name="redirectUri" required type="url" placeholder="https://your-app.example/callback" className="w-full border border-[#d9cbb9] px-3 py-2 text-sm" /><button disabled={busy} className="inline-flex items-center gap-2 bg-[#33251d] px-3 py-2 text-sm font-semibold text-white"><KeyRound size={15} /> Create client</button></form></div>}</article>)}</div>
            </section>}
            {newSecret && <div className="fixed inset-x-4 bottom-6 z-10 mx-auto max-w-xl border border-[#d97722] bg-[#fff7ed] p-5 shadow-xl"><div className="flex items-start justify-between gap-4"><div><p className="font-semibold">Copy this client secret now</p><p className="mt-1 text-sm text-[#806f60]">It will not be shown again after closing this message.</p><code className="mt-4 block break-all bg-white p-3 text-sm">{newSecret.secret}</code></div><button onClick={() => setNewSecret(null)} className="text-sm font-semibold text-[#d97722]">Done</button></div></div>}
        </div>
    </main>;
}