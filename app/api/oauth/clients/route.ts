
import { NextRequest, NextResponse } from "next/server";
import { createPublicKey } from "crypto";
import { getUid } from "@/lib/access/auth";
import { registerOAuthClient } from "@/lib/oauth/store";
import { GRANTABLE_SCOPES, sanitizeRequestedScopes } from "@/lib/oauth/scopes";
import { isDeveloper } from "@/lib/oauth/developerStore";

export async function GET() {
    // The full catalogue of scopes a client can ever request -- useful for
    // building a "create app" form.
    return NextResponse.json({ scopes: GRANTABLE_SCOPES });
}

export async function POST(req: NextRequest) {
    const uid = getUid(req);
    if (!(await isDeveloper(uid))) {
        return NextResponse.json({ error: "Developer account required" }, { status: 403 });
    }

    let body: {
        name?: string;
        appId?: string;
        redirectUris?: string[];
        scopes?: string[];
        logoUrl?: string;
        authMethod?: "client_secret" | "private_key_jwt";
        publicKey?: string;
    };
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
    const authMethod = body.authMethod ?? "client_secret";

    try {
        if (authMethod === "private_key_jwt") {
            if (!body.publicKey) {
                return NextResponse.json(
                    { error: "publicKey (PEM, RSA or EC) is required for authMethod=private_key_jwt" },
                    { status: 400 },
                );
            }
            try {
                const keyObject = createPublicKey(body.publicKey);
                if (keyObject.asymmetricKeyType !== "rsa" && keyObject.asymmetricKeyType !== "ec") {
                    throw new Error(`Unsupported key type: ${keyObject.asymmetricKeyType}`);
                }
            } catch (err) {
                return NextResponse.json(
                    {
                        error: `publicKey is not a valid RSA or EC PEM public key: ${
                            err instanceof Error ? err.message : "parse error"
                        }`,
                    },
                    { status: 400 },
                );
            }
            const { clientId } = await registerOAuthClient({
                appId: body.appId,
                name,
                redirectUris,
                scopes,
                ownerUid: uid,
                logoUrl,
                authMethod: "private_key_jwt",
                publicKey: body.publicKey,
            });
            return NextResponse.json({
                clientId,
                authMethod,
                // note: "No secret is issued for private_key_jwt clients -- sign a client_assertion with your private key instead. See docs for the expected JWT claims.",
            }, { headers: { "Cache-Control": "no-store" } });
        }

        const { clientId, clientSecret } = await registerOAuthClient({
            appId: body.appId,
            name,
            redirectUris,
            scopes,
            ownerUid: uid,
            logoUrl,
            authMethod: "client_secret",
        });
        return NextResponse.json({
            clientId,
            clientSecret,
            authMethod,
            // warning: "This client secret is shown only once. Store it now -- it cannot be retrieved again.",
        }, { headers: { "Cache-Control": "no-store" } });
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Failed to register client" },
            { status: 400 },
        );
    }
}