
import { createPublicKey, verify as cryptoVerify, type KeyObject } from "crypto";
import { db } from "@/lib/firebaseAdmin";
import { base64urlDecode } from "@/lib/oauth/jwt";
import { OAuthClient } from "@/lib/oauth/store";

export class ClientAssertionError extends Error {}

// Explicit allowlist -- never infer/trust an algorithm from the token itself
// (this is how "alg: none" and algorithm-confusion attacks happen).
const ALLOWED_ALGS: Record<string, { nodeAlg: string; dsaEncoding?: "ieee-p1363" }> = {
    RS256: { nodeAlg: "RSA-SHA256" },
    ES256: { nodeAlg: "sha256", dsaEncoding: "ieee-p1363" }, // JWT ECDSA sigs are raw r||s, not DER
};

// Keep assertions genuinely short-lived; this isn't meant to double as a
// long-lived credential. 5 minutes is generous for clock skew + latency.
const MAX_ASSERTION_LIFETIME_SECONDS = 300;

type AssertionPayload = {
    iss?: string;
    sub?: string;
    aud?: string;
    exp?: number;
    iat?: number;
    jti?: string;
};

/** Throws a ClientAssertionError on any validation failure; resolves on success. */
export async function verifyClientAssertion(
    client: OAuthClient,
    assertion: string,
    tokenEndpointUrl: string,
): Promise<void> {
    if (client.authMethod !== "private_key_jwt" || !client.publicKey) {
        throw new ClientAssertionError("Client is not configured for private_key_jwt");
    }

    const parts = assertion.split(".");
    if (parts.length !== 3) throw new ClientAssertionError("Malformed assertion");
    const [encodedHeader, encodedPayload, encodedSignature] = parts;

    let header: { alg?: string; typ?: string };
    let payload: AssertionPayload;

    try {
        header = JSON.parse(base64urlDecode(encodedHeader).toString("utf8"));
        payload = JSON.parse(base64urlDecode(encodedPayload).toString("utf8"));
    } catch {
        throw new ClientAssertionError("Malformed assertion");
    }

    const algSpec = header.alg ? ALLOWED_ALGS[header.alg] : undefined;
    if (!algSpec) {
        throw new ClientAssertionError(`Unsupported or missing alg: ${header.alg}`);
    }

    // Per RFC 7523: iss and sub both identify the client itself.
    if (!payload.iss || payload.iss !== client.clientId || payload.sub !== client.clientId) {
        throw new ClientAssertionError("iss/sub must equal the client_id");
    }

    // Exact match required -- see draft-ietf-oauth-rfc7523bis on audience
    // confusion. Don't accept prefixes, alternate schemes, or issuer URLs.
    if (payload.aud !== tokenEndpointUrl) {
        throw new ClientAssertionError("aud does not match this token endpoint");
    }

    if (!payload.jti) {
        throw new ClientAssertionError("Missing jti");
    }

    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== "number" || payload.exp < now) {
        throw new ClientAssertionError("Assertion expired");
    }
    if (payload.exp - now > MAX_ASSERTION_LIFETIME_SECONDS) {
        throw new ClientAssertionError("Assertion lifetime exceeds the maximum allowed");
    }

    let publicKey: KeyObject;
    try {
        publicKey = createPublicKey(client.publicKey);
    } catch {
        // Shouldn't happen -- validated at registration -- but don't trust stored data blindly.
        throw new ClientAssertionError("Client has an invalid registered public key");
    }

    const signingInput = Buffer.from(`${encodedHeader}.${encodedPayload}`);
    const signature = base64urlDecode(encodedSignature);
    const verifyKey = algSpec.dsaEncoding ? { key: publicKey, dsaEncoding: algSpec.dsaEncoding } : publicKey;

    let validSignature: boolean;
    try {
        validSignature = cryptoVerify(algSpec.nodeAlg, signingInput, verifyKey, signature);
    } catch {
        validSignature = false;
    }
    if (!validSignature) {
        throw new ClientAssertionError("Invalid signature");
    }

    await assertJtiNotReplayed(client.clientId, payload.jti, payload.exp);
}

/**
 * Atomically rejects a jti that's already been used. Docs are keyed by
 * clientId+jti and store their own expiry so a Firestore TTL policy on
 * `expiresAt` (set once, in the console) can garbage-collect them --
 * no cleanup job needed on our side.
 */
async function assertJtiNotReplayed(clientId: string, jti: string, expSeconds: number): Promise<void> {
    const ref = db.collection("oauthAssertionReplay").doc(`${clientId}__${jti}`);

    await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (snap.exists) {
            throw new ClientAssertionError("Assertion has already been used (replay)");
        }
        tx.set(ref, { clientId, jti, expiresAt: new Date(expSeconds * 1000) });
    });
}