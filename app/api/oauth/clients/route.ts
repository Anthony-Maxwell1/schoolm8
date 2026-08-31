/**
 * app/api/oauth/clients/route.ts
 *
 * Minimal developer-facing client registration. Any signed-in user can
 * register an app; `client_secret` is returned exactly once (on creation)
 * and never stored or shown again, only its hash. There's plenty of room
 * to grow this into a full "developer portal" later (edit, rotate secret,
 * delete, per-app logo upload, etc.) -- this covers the wiring needed for
 * the authorize/token flow to work end to end.
 */

import { NextRequest, NextResponse } from "next/server";
import { getUid } from "@/lib/access/auth";
import { registerOAuthClient } from "@/lib/oauth/store";
import { GRANTABLE_SCOPES, sanitizeRequestedScopes } from "@/lib/oauth/scopes";

export async function GET() {
    // The full catalogue of scopes a client can ever request -- useful for
    // building a "create app" form.
    return NextResponse.json({ scopes: GRANTABLE_SCOPES });
}

export async function POST(req: NextRequest) {
    const uid = getUid(req);

    let body: { name?: string; redirectUris?: string[]; scopes?: string[]; logoUrl?: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { name, redirectUris, logoUrl } = body;
    if (!name || !Array.isArray(redirectUris) || redirectUris.length === 0) {
        return NextResponse.json({ error: "Missing name or redirectUris" }, { status: 400 });
    }

    for (const uri of redirectUris) {
        try {
            const parsed = new URL(uri);
            if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") {
                return NextResponse.json(
                    { error: `redirectUri must be https (got: ${uri})` },
                    { status: 400 },
                );
            }
        } catch {
            return NextResponse.json({ error: `Invalid redirectUri: ${uri}` }, { status: 400 });
        }
    }

    const scopes = sanitizeRequestedScopes(body.scopes ?? []);

    const { clientId, clientSecret } = await registerOAuthClient({
        name,
        redirectUris,
        scopes,
        ownerUid: uid,
        logoUrl,
    });

    return NextResponse.json({
        clientId,
        clientSecret,
        warning: "This client secret is shown only once. Store it now -- it cannot be retrieved again.",
    });
}
