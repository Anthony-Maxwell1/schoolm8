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
    appId?: string;
    name: string;
    redirectUris: string[];
    scopes: string[]; // the maximum set of scopes this app is allowed to ever request
    ownerUid: string;
    logoUrl?: string;
    createdAt: FirebaseFirestore.Timestamp | Date;
    authMethod: "client_secret" | "private_key_jwt";
    secretHash?: string; // only for authMethod === "client_secret"
    publicKey?: string; // PEM, only for authMethod === "private_key_jwt"
};

type RegisterClientCommonParams = {
    appId?: string;
    name: string;
    redirectUris: string[];
    scopes: string[];
    ownerUid: string;
    logoUrl?: string;
};

type RegisterClientParams =
    | (RegisterClientCommonParams & { authMethod: "client_secret" })
    | (RegisterClientCommonParams & { authMethod: "private_key_jwt"; publicKey: string });

// Overloads so callers get a precisely-typed return value based on authMethod,
// without needing an `as` cast at the call site.
export async function registerOAuthClient(
    params: RegisterClientCommonParams & { authMethod: "client_secret" },
): Promise<{ clientId: string; clientSecret: string }>;
export async function registerOAuthClient(
    params: RegisterClientCommonParams & { authMethod: "private_key_jwt"; publicKey: string },
): Promise<{ clientId: string }>;
export async function registerOAuthClient(
    params: RegisterClientParams,
): Promise<{ clientId: string; clientSecret?: string }> {
    const clientId = randomBytes(16).toString("hex");
    let base = {
        clientId,
        appId: params.appId,
        name: params.name,
        redirectUris: params.redirectUris,
        scopes: params.scopes,
        ownerUid: params.ownerUid,
        createdAt: new Date(),
        logoUrl: params.logoUrl,
    };
    if (base.logoUrl == undefined || base.logoUrl == null) delete base.logoUrl;
    
    if (params.authMethod === "private_key_jwt") {
        const client: OAuthClient = { ...base, authMethod: "private_key_jwt", publicKey: params.publicKey };
        await db.collection("oauthClients").doc(clientId).set(client);
        return { clientId };
    }

    const clientSecret = randomBytes(32).toString("base64url");
    const client: OAuthClient = { ...base, authMethod: "client_secret", secretHash: hashToken(clientSecret) };
    await db.collection("oauthClients").doc(clientId).set(client);
    return { clientId, clientSecret };
}

export async function getOAuthClient(clientId: string): Promise<OAuthClient | null> {
    const snap = await db.collection("oauthClients").doc(clientId).get();
    return snap.exists ? (snap.data() as OAuthClient) : null;
}

export function verifyClientSecret(client: OAuthClient, secret: string): boolean {
    return !!client.secretHash && client.secretHash === hashToken(secret);
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

export async function listOAuthClients(ownerUid: string, appId?: string): Promise<OAuthClient[]> {
    const snap = await db.collection("oauthClients").where("ownerUid", "==", ownerUid).get();
    return snap.docs
        .map((doc) => doc.data() as OAuthClient)
        .filter((client) => !appId || client.appId === appId);
}

export async function rotateOAuthClientSecret(
    clientId: string,
    ownerUid: string,
): Promise<{ client: OAuthClient; clientSecret: string } | null> {
    const client = await getOAuthClient(clientId);
    if (!client || client.ownerUid !== ownerUid || client.authMethod !== "client_secret") {
        return null;
    }
    const clientSecret = randomBytes(32).toString("base64url");
    await db.collection("oauthClients").doc(clientId).update({ secretHash: hashToken(clientSecret) });
    return { client: { ...client, secretHash: undefined }, clientSecret };
}

export async function deleteOAuthClient(clientId: string, ownerUid: string): Promise<boolean> {
    const client = await getOAuthClient(clientId);
    if (!client || client.ownerUid !== ownerUid) return false;
    await db.collection("oauthClients").doc(clientId).delete();
    return true;
}