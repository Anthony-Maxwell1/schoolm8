/**
 * lib/oauth/store.ts
 *
 * Firestore-backed persistence for the "Sign in with schoolm8" OAuth
 * provider used by third-party apps.
 *
 * Collections:
 *   oauthClients/{clientId}         - registered third-party apps
 *   oauthCodes/{code}               - one-time authorization codes (~60s TTL)
 *   oauthGrants/{clientId}__{uid}   - which scopes a user has approved for a client
 *   oauthRefreshTokens/{tokenHash}  - long-lived refresh tokens (hashed at rest)
 */

import { randomBytes, randomUUID, createHash } from "crypto";
import { db } from "@/lib/firebaseAdmin";

const CODE_TTL_MS = 60_000; // authorization codes are single-use and short-lived
const REFRESH_TOKEN_BYTES = 48;

function hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
}

/* ------------------------------------------------------------------ */
/* Clients                                                              */
/* ------------------------------------------------------------------ */

export type OAuthClient = {
    clientId: string;
    name: string;
    redirectUris: string[];
    scopes: string[]; // the maximum set of scopes this app is allowed to ever request
    secretHash: string;
    ownerUid: string;
    logoUrl?: string;
    createdAt: FirebaseFirestore.Timestamp | Date;
};

export async function registerOAuthClient(params: {
    name: string;
    redirectUris: string[];
    scopes: string[];
    ownerUid: string;
    logoUrl?: string;
}): Promise<{ clientId: string; clientSecret: string }> {
    const clientId = randomBytes(16).toString("hex");
    const clientSecret = randomBytes(32).toString("base64url");

    const client: OAuthClient = {
        clientId,
        name: params.name,
        redirectUris: params.redirectUris,
        scopes: params.scopes,
        secretHash: hashToken(clientSecret),
        ownerUid: params.ownerUid,
        logoUrl: params.logoUrl,
        createdAt: new Date(),
    };

    await db.collection("oauthClients").doc(clientId).set(client);
    return { clientId, clientSecret };
}

export async function getOAuthClient(clientId: string): Promise<OAuthClient | null> {
    const snap = await db.collection("oauthClients").doc(clientId).get();
    return snap.exists ? (snap.data() as OAuthClient) : null;
}

export function verifyClientSecret(client: OAuthClient, secret: string): boolean {
    return client.secretHash === hashToken(secret);
}

export function isRedirectUriAllowed(client: OAuthClient, redirectUri: string): boolean {
    return client.redirectUris.includes(redirectUri);
}

/* ------------------------------------------------------------------ */
/* Authorization codes                                                  */
/* ------------------------------------------------------------------ */

export type OAuthCode = {
    clientId: string;
    uid: string;
    redirectUri: string;
    scopes: string[];
    codeChallenge?: string;
    codeChallengeMethod?: "S256" | "plain";
    expiresAt: number; // epoch ms
};

export async function createAuthorizationCode(params: {
    clientId: string;
    uid: string;
    redirectUri: string;
    scopes: string[];
    codeChallenge?: string;
    codeChallengeMethod?: "S256" | "plain";
}): Promise<string> {
    const code = randomBytes(32).toString("base64url");
    const doc: OAuthCode = {
        clientId: params.clientId,
        uid: params.uid,
        redirectUri: params.redirectUri,
        scopes: params.scopes,
        codeChallenge: params.codeChallenge,
        codeChallengeMethod: params.codeChallengeMethod,
        expiresAt: Date.now() + CODE_TTL_MS,
    };
    await db.collection("oauthCodes").doc(code).set(doc);
    return code;
}

/** Atomically fetches + deletes a code so it can never be replayed, even under a race. */
export async function consumeAuthorizationCode(code: string): Promise<OAuthCode | null> {
    const ref = db.collection("oauthCodes").doc(code);
    return db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists) return null;
        const data = snap.data() as OAuthCode;
        tx.delete(ref);
        if (data.expiresAt < Date.now()) return null;
        return data;
    });
}

/* ------------------------------------------------------------------ */
/* Grants (per user, per client, which scopes were approved)           */
/* ------------------------------------------------------------------ */

function grantId(clientId: string, uid: string) {
    return `${clientId}__${uid}`;
}

export async function setGrant(uid: string, clientId: string, scopes: string[]): Promise<void> {
    await db
        .collection("oauthGrants")
        .doc(grantId(clientId, uid))
        .set({ uid, clientId, scopes, updatedAt: new Date() }, { merge: true });
}

export async function getGrant(uid: string, clientId: string): Promise<string[] | null> {
    const snap = await db.collection("oauthGrants").doc(grantId(clientId, uid)).get();
    if (!snap.exists) return null;
    return (snap.data()?.scopes as string[]) ?? [];
}

export async function revokeGrant(uid: string, clientId: string): Promise<void> {
    await db.collection("oauthGrants").doc(grantId(clientId, uid)).delete();

    const tokensSnap = await db
        .collection("oauthRefreshTokens")
        .where("uid", "==", uid)
        .where("clientId", "==", clientId)
        .get();

    await Promise.all(tokensSnap.docs.map((d) => d.ref.delete()));
}

export async function listGrantsForUser(
    uid: string,
): Promise<Array<{ clientId: string; scopes: string[] }>> {
    const snap = await db.collection("oauthGrants").where("uid", "==", uid).get();
    return snap.docs.map((d) => ({
        clientId: d.data().clientId as string,
        scopes: d.data().scopes as string[],
    }));
}

/* ------------------------------------------------------------------ */
/* Refresh tokens                                                       */
/* ------------------------------------------------------------------ */

export type RefreshTokenRecord = {
    uid: string;
    clientId: string;
    scopes: string[];
    createdAt: Date;
    revoked: boolean;
};

export async function createRefreshToken(params: {
    uid: string;
    clientId: string;
    scopes: string[];
}): Promise<string> {
    const token = randomBytes(REFRESH_TOKEN_BYTES).toString("base64url");
    const record: RefreshTokenRecord = {
        uid: params.uid,
        clientId: params.clientId,
        scopes: params.scopes,
        createdAt: new Date(),
        revoked: false,
    };
    await db.collection("oauthRefreshTokens").doc(hashToken(token)).set(record);
    return token;
}

/** Validates a refresh token and rotates it (old one is revoked, a new one is issued). */
export async function rotateRefreshToken(
    token: string,
): Promise<{ record: RefreshTokenRecord; newToken: string } | null> {
    const ref = db.collection("oauthRefreshTokens").doc(hashToken(token));
    const snap = await ref.get();
    if (!snap.exists) return null;

    const record = snap.data() as RefreshTokenRecord;
    if (record.revoked) return null;

    await ref.update({ revoked: true });
    const newToken = await createRefreshToken({
        uid: record.uid,
        clientId: record.clientId,
        scopes: record.scopes,
    });

    return { record, newToken };
}

export async function newTokenId(): Promise<string> {
    return randomUUID();
}
