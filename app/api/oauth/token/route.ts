/**
 * app/api/oauth/token/route.ts
 *
 * This endpoint is listed in middleware.ts's PUBLIC_PREFIXES: it is called
 * server-to-server by the third-party app itself, which has no schoolm8
 * user credential (Firebase ID token / session cookie) to present. It
 * authenticates the caller via `client_id` + `client_secret` in the body
 * instead, exactly like a standard OAuth2 token endpoint.
 *
 * Supported grant types:
 *   authorization_code  { code, redirect_uri, code_verifier? }
 *   refresh_token       { refresh_token }
 */

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

const ACCESS_TOKEN_TTL_SECONDS = 60 * 60; // 1 hour

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
    if (!clientId || !clientSecret) {
        return NextResponse.json({ error: "invalid_client" }, { status: 401 });
    }

    const client = await getOAuthClient(clientId);
    if (!client || !verifyClientSecret(client, clientSecret)) {
        return NextResponse.json({ error: "invalid_client" }, { status: 401 });
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
