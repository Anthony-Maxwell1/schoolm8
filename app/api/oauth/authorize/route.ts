/**
 * app/api/oauth/authorize/route.ts
 *
 * Called by app/oauth/authorize/page.tsx once the signed-in user has
 * decided which of the requested scopes (if any) to grant. Not reachable
 * with an OAuth access token itself (see middleware.ts -- api/oauth/* has
 * no entry in ENDPOINT_TO_SCOPE, so third-party tokens are refused).
 */

import { NextRequest, NextResponse } from "next/server";
import { getUid } from "@/lib/access/auth";
import { getOAuthClient, isRedirectUriAllowed, createAuthorizationCode, setGrant } from "@/lib/oauth/store";
import { sanitizeRequestedScopes } from "@/lib/oauth/scopes";

export async function POST(req: NextRequest) {
    const uid = getUid(req);

    let body: {
        clientId?: string;
        redirectUri?: string;
        grantedScopes?: string[];
        state?: string;
        codeChallenge?: string;
        codeChallengeMethod?: "S256" | "plain";
        deny?: boolean;
    };

    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { clientId, redirectUri, state, codeChallenge, codeChallengeMethod } = body;

    if (!clientId || !redirectUri) {
        return NextResponse.json({ error: "Missing clientId or redirectUri" }, { status: 400 });
    }

    const client = await getOAuthClient(clientId);
    if (!client) {
        return NextResponse.json({ error: "Unknown clientId" }, { status: 404 });
    }
    if (!isRedirectUriAllowed(client, redirectUri)) {
        return NextResponse.json({ error: "redirectUri is not registered for this client" }, { status: 400 });
    }

    const redirect = new URL(redirectUri);

    if (body.deny) {
        redirect.searchParams.set("error", "access_denied");
        if (state) redirect.searchParams.set("state", state);
        return NextResponse.json({ redirectTo: redirect.toString() });
    }

    // The user can only narrow scopes down, never grant more than the
    // client is registered for.
    const grantedScopes = sanitizeRequestedScopes(body.grantedScopes ?? []).filter((s) =>
        client.scopes.includes(s),
    );

    await setGrant(uid, clientId, grantedScopes);

    const code = await createAuthorizationCode({
        clientId,
        uid,
        redirectUri,
        scopes: grantedScopes,
        codeChallenge,
        codeChallengeMethod,
    });

    redirect.searchParams.set("code", code);
    if (state) redirect.searchParams.set("state", state);

    return NextResponse.json({ redirectTo: redirect.toString() });
}
