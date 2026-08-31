/**
 * lib/oauth/jwt.ts
 *
 * A minimal, dependency-free HS256 JWT signer/verifier used only for
 * schoolm8's own OAuth *access tokens* (the ones we hand to third-party
 * apps). This is deliberately NOT used for Firebase ID tokens or session
 * cookies -- those are verified with `firebase-admin` in middleware.ts,
 * which knows how to validate Google's RS256 signatures. Keeping our own
 * tokens HS256 + home-grown lets `middleware.ts` tell the two apart at a
 * glance (see `looksLikeOAuthAccessToken`) without an extra network round
 * trip.
 *
 * Token shape (once decoded): { sub: uid, cid: clientId, scope: "a b c",
 * jti, iat, exp, iss: "schoolm8" }
 */

import { createHmac, timingSafeEqual } from "crypto";

const ISSUER = "schoolm8";

function base64url(input: Buffer | string): string {
    return Buffer.from(input)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

function base64urlDecode(input: string): Buffer {
    const padded = input
        .replace(/-/g, "+")
        .replace(/_/g, "/")
        .padEnd(Math.ceil(input.length / 4) * 4, "=");
    return Buffer.from(padded, "base64");
}

function getSecret(): string {
    const secret = process.env.OAUTH_SIGNING_SECRET;
    if (!secret || secret.length < 16) {
        throw new Error(
            "OAUTH_SIGNING_SECRET is not configured (or too short). Set a strong random value, e.g.: " +
                "node -e \"console.log(require('crypto').randomBytes(48).toString('base64'))\"",
        );
    }
    return secret;
}

export type OAuthAccessTokenClaims = {
    sub: string; // uid
    cid: string; // OAuth client id
    scope: string; // space-separated granted scopes
    jti: string; // unique token id (for revocation bookkeeping)
    iat: number;
    exp: number;
    iss: typeof ISSUER;
};

export function signOAuthAccessToken(
    claims: Omit<OAuthAccessTokenClaims, "iat" | "exp" | "iss">,
    expiresInSeconds: number,
): string {
    const header = { alg: "HS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const payload: OAuthAccessTokenClaims = {
        ...claims,
        iat: now,
        exp: now + expiresInSeconds,
        iss: ISSUER,
    };

    const encodedHeader = base64url(JSON.stringify(header));
    const encodedPayload = base64url(JSON.stringify(payload));
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const signature = createHmac("sha256", getSecret()).update(signingInput).digest();

    return `${signingInput}.${base64url(signature)}`;
}

/** Cheap structural check: is this a 3-part JWT with our header shape, without verifying the signature? */
export function looksLikeOAuthAccessToken(token: string): boolean {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    try {
        const header = JSON.parse(base64urlDecode(parts[0]).toString("utf8"));
        return header?.alg === "HS256" && header?.typ === "JWT";
    } catch {
        return false;
    }
}

/** Verifies signature + expiry + issuer. Throws on any failure. */
export function verifyOAuthAccessToken(token: string): OAuthAccessTokenClaims {
    const parts = token.split(".");
    if (parts.length !== 3) throw new Error("Malformed token");
    const [encodedHeader, encodedPayload, encodedSignature] = parts;

    const expectedSig = createHmac("sha256", getSecret())
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest();
    const actualSig = base64urlDecode(encodedSignature);

    if (expectedSig.length !== actualSig.length || !timingSafeEqual(expectedSig, actualSig)) {
        throw new Error("Invalid token signature");
    }

    const payload = JSON.parse(base64urlDecode(encodedPayload).toString("utf8")) as OAuthAccessTokenClaims;

    if (payload.iss !== ISSUER) throw new Error("Invalid issuer");
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error("Token expired");
    }

    return payload;
}
