"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAccessControl } from "@/lib/access/useAccessControl";
import apiFetch from "@/lib/fetch";
import {
    Alert,
    Avatar,
    Button,
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    CardSubtitle,
    CardTitle,
    Checkbox,
    SpinnerFullPage,
    Text,
} from "@/components/ui/components";

type ClientInfo = {
    name: string;
    logoUrl: string | null;
    scopes: { id: string; description: string }[];
};

function AuthorizeInner() {
    const { allowed, loading: accessLoading } = useAccessControl("oauth/authorize");
    const params = useSearchParams();

    const clientId = params.get("client_id") ?? "";
    const redirectUri = params.get("redirect_uri") ?? "";
    const scope = params.get("scope") ?? "";
    const state = params.get("state") ?? "";
    const codeChallenge = params.get("code_challenge") ?? undefined;
    const codeChallengeMethod = (params.get("code_challenge_method") as "S256" | "plain") || undefined;

    const [client, setClient] = useState<ClientInfo | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<Record<string, boolean>>({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!clientId || !redirectUri) {
            setError("This link is missing required parameters (client_id / redirect_uri).");
            return;
        }

        const qs = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, scope });
        apiFetch(`/api/oauth/client-info?${qs.toString()}`)
            .then((data: ClientInfo) => {
                setClient(data);
                setSelected(Object.fromEntries(data.scopes.map((s) => [s.id, true])));
            })
            .catch(() => setError("This app isn't recognized, or its redirect URL doesn't match its registration."));
    }, [clientId, redirectUri, scope]);

    const respond = async (deny: boolean) => {
        setSubmitting(true);
        try {
            const grantedScopes = Object.entries(selected)
                .filter(([, v]) => v)
                .map(([k]) => k);

            const res = await apiFetch("/api/oauth/authorize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    clientId,
                    redirectUri,
                    grantedScopes,
                    state,
                    codeChallenge,
                    codeChallengeMethod,
                    deny,
                }),
            });
            window.location.href = res.redirectTo;
        } catch {
            setError("Something went wrong completing the request. Please try again.");
            setSubmitting(false);
        }
    };

    if (accessLoading) return <SpinnerFullPage label="Loading…" />;
    if (!allowed) return null;

    return (
        <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4">
            <Card className="w-full">
                <CardHeader className="flex flex-col items-center gap-3 text-center">
                    {client?.logoUrl && <Avatar src={client.logoUrl} alt={client.name} size="lg" />}
                    <CardTitle>{client ? client.name : "Third-party app"}</CardTitle>
                    <CardSubtitle>wants to connect to your schoolm8 account</CardSubtitle>
                </CardHeader>

                <CardBody className="space-y-4">
                    {error && <Alert variant="danger">{error}</Alert>}

                    {!error && !client && <Text variant="body">Loading request details…</Text>}

                    {!error && client && (
                        <>
                            <Text variant="body" className="text-[var(--color-text-secondary)]">
                                Choose what {client.name} can access. You can uncheck anything you
                                don&apos;t want to share, and change this later from Settings.
                            </Text>
                            <div className="space-y-2">
                                {client.scopes.length === 0 && (
                                    <Text variant="body">This app isn&apos;t requesting any permissions.</Text>
                                )}
                                {client.scopes.map((s) => (
                                    <Checkbox
                                        key={s.id}
                                        label={s.description}
                                        checked={!!selected[s.id]}
                                        onChange={(e) =>
                                            setSelected((prev) => ({ ...prev, [s.id]: e.target.checked }))
                                        }
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </CardBody>

                {!error && client && (
                    <CardFooter className="flex justify-end gap-2">
                        <Button variant="ghost" disabled={submitting} onClick={() => respond(true)}>
                            Deny
                        </Button>
                        <Button variant="primary" disabled={submitting} onClick={() => respond(false)}>
                            Allow
                        </Button>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}

export default function OAuthAuthorizePage() {
    return (
        <Suspense fallback={<SpinnerFullPage label="Loading…" />}>
            <AuthorizeInner />
        </Suspense>
    );
}
