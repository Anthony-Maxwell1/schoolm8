
import { createHash, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
    getOAuthClient,
    verifyClientSecret,
    consumeAuthorizationCode,
    createRefreshToken,
    rotateRefreshToken,
    newTokenId,
} from "@/lib/oauth/store";
import { signOAuthAccessToken } from "@/lib/oauth/jwt";
import { verifyClientAssertion, ClientAssertionError } from "@/lib/oauth/clientAssertion";

const ACCESS_TOKEN_TTL_SECONDS = 60 * 60; // 1 hour
const CLIENT_ASSERTION_TYPE = "urn:ietf:params:oauth:client-assertion-type:jwt-bearer";

// This MUST be the exact, canonical URL clients sign into `aud` -- not
// derived from request headers (Host is client-controlled). Set it once
// via env so it can't silently drift between environments.
const TOKEN_ENDPOINT_URL = process.env.OAUTH_TOKEN_ENDPOINT_URL ?? "https://schoolm8.app/api/oauth/token";

function pkceMatches(verifier: string, challenge: string, method: "S256" | "plain" = "S256"): boolean {
    const computed =
        method === "plain"
            ? verifier
            : createHash("sha256").update(verifier).digest("base64url");

    const a = Buffer.from(computed);
    const b = Buffer.from(challenge);
    return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
    let body: Record<string, string | undefined>;
    const contentType = req.headers.get("content-type") ?? "";

    try {
        if (contentType.includes("application/json")) {
            body = await req.json();
        } else {
            const form = await req.formData();
            body = Object.fromEntries(form.entries()) as Record<string, string>;
        }
    } catch {
        return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }

    const clientId = body.client_id;
    const clientSecret = body.client_secret;
    const clientAssertion = body.client_assertion;

    if (!clientId || (!clientSecret && !clientAssertion)) {
        return NextResponse.json({ error: "invalid_client" }, { status: 401 });
    }

    const client = await getOAuthClient(clientId);
    if (!client) {
        return NextResponse.json({ error: "invalid_client" }, { status: 401 });
    }

    if (client.authMethod === "private_key_jwt") {
        if (!clientAssertion) {
            return NextResponse.json({ error: "invalid_client" }, { status: 401 });
        }
        if (body.client_assertion_type && body.client_assertion_type !== CLIENT_ASSERTION_TYPE) {
            return NextResponse.json({ error: "invalid_request" }, { status: 400 });
        }
        try {
            await verifyClientAssertion(client, clientAssertion, TOKEN_ENDPOINT_URL);
        } catch (err) {
            const description =
                err instanceof ClientAssertionError ? err.message : "assertion verification failed";
            return NextResponse.json(
                { error: "invalid_client", error_description: description },
                { status: 401 },
            );
        }
    } else {
        if (!clientSecret || !verifyClientSecret(client, clientSecret)) {
            return NextResponse.json({ error: "invalid_client" }, { status: 401 });
        }
    }

    if (body.grant_type === "authorization_code") {
        const { code, redirect_uri, code_verifier } = body;
        if (!code || !redirect_uri) {
            return NextResponse.json({ error: "invalid_request" }, { status: 400 });
        }

        const authCode = await consumeAuthorizationCode(code);
        if (!authCode || authCode.clientId !== clientId || authCode.redirectUri !== redirect_uri) {
            return NextResponse.json({ error: "invalid_grant" }, { status: 400 });
        }

        if (authCode.codeChallenge) {
            if (!code_verifier || !pkceMatches(code_verifier, authCode.codeChallenge, authCode.codeChallengeMethod)) {
                return NextResponse.json({ error: "invalid_grant" }, { status: 400 });
            }
        }

        const accessToken = signOAuthAccessToken(
            { sub: authCode.uid, cid: clientId, scope: authCode.scopes.join(" "), jti: await newTokenId() },
            ACCESS_TOKEN_TTL_SECONDS,
        );
        const refreshToken = await createRefreshToken({
            uid: authCode.uid,
            clientId,
            scopes: authCode.scopes,
        });

        return NextResponse.json({
            access_token: accessToken,
            token_type: "Bearer",
            expires_in: ACCESS_TOKEN_TTL_SECONDS,
            refresh_token: refreshToken,
            scope: authCode.scopes.join(" "),
        });
    }

    if (body.grant_type === "refresh_token") {
        const { refresh_token } = body;
        if (!refresh_token) {
            return NextResponse.json({ error: "invalid_request" }, { status: 400 });
        }

        const rotated = await rotateRefreshToken(refresh_token);
        if (!rotated || rotated.record.clientId !== clientId) {
            return NextResponse.json({ error: "invalid_grant" }, { status: 400 });
        }

        const accessToken = signOAuthAccessToken(
            {
                sub: rotated.record.uid,
                cid: clientId,
                scope: rotated.record.scopes.join(" "),
                jti: await newTokenId(),
            },
            ACCESS_TOKEN_TTL_SECONDS,
        );

        return NextResponse.json({
            access_token: accessToken,
            token_type: "Bearer",
            expires_in: ACCESS_TOKEN_TTL_SECONDS,
            refresh_token: rotated.newToken,
            scope: rotated.record.scopes.join(" "),
        });
    }

    return NextResponse.json({ error: "unsupported_grant_type" }, { status: 400 });
}