/**
 * lib/ai/geminiKey.ts
 *
 * Per-user Gemini configuration stored under `users/{uid}.ai`. The API key is
 * encrypted at rest (see lib/crypto) and only ever decrypted server-side when a
 * request is about to call Gemini. Nothing here is safe to import client-side.
 */

import { db } from "@/lib/firebaseAdmin";
import { decryptSecret, encryptSecret, isEncrypted, maskSecret } from "@/lib/crypto";
import { DEFAULT_GEMINI_MODEL, resolveModel } from "./models";
import { validateGeminiKey, type GeminiKeyState } from "./client";

export type KeyStatus = GeminiKeyState | "unset";

export interface StoredAiSettings {
    geminiKeyEnc?: string;
    keyLast4?: string;
    model?: string;
    keyStatus?: KeyStatus;
    updatedAt?: string;
    lastCheckedAt?: string;
}

/** Safe-to-send-to-the-client view of a user's AI settings (never the key). */
export interface PublicAiSettings {
    hasKey: boolean;
    keyLast4: string | null;
    model: string;
    keyStatus: KeyStatus;
    updatedAt: string | null;
    lastCheckedAt: string | null;
}

const userRef = (uid: string) => db.collection("users").doc(uid);

async function readAi(uid: string): Promise<StoredAiSettings> {
    const snap = await userRef(uid).get();
    return (snap.exists ? (snap.data()?.ai ?? {}) : {}) as StoredAiSettings;
}

export async function getPublicAiSettings(uid: string): Promise<PublicAiSettings> {
    const ai = await readAi(uid);
    const hasKey = Boolean(ai.geminiKeyEnc);
    return {
        hasKey,
        keyLast4: ai.keyLast4 ?? null,
        model: resolveModel(ai.model),
        keyStatus: hasKey ? (ai.keyStatus ?? "error") : "unset",
        updatedAt: ai.updatedAt ?? null,
        lastCheckedAt: ai.lastCheckedAt ?? null,
    };
}

export async function testApiKey(uid: string): Promise<KeyStatus> {
    const ai = await readAi(uid);
    if (!ai.geminiKeyEnc) return "unset";
    try {
        const rawKey = isEncrypted(ai.geminiKeyEnc)
            ? decryptSecret(ai.geminiKeyEnc)
            : ai.geminiKeyEnc; // tolerate any legacy plaintext, will be re-encrypted on next save
        const result = await validateGeminiKey(rawKey);

        await saveGeminiKey(uid, rawKey, result.state);
        return result.state;
    } catch {
        return "error";
    }
}

/** Decrypt and return the raw Gemini key, or null if none is set. Server-only. */
export async function getDecryptedGeminiKey(uid: string): Promise<string | null> {
    const ai = await readAi(uid);
    if (!ai.geminiKeyEnc) return null;
    try {
        return isEncrypted(ai.geminiKeyEnc) ? decryptSecret(ai.geminiKeyEnc) : ai.geminiKeyEnc; // tolerate any legacy plaintext, will be re-encrypted on next save
    } catch (err) {
        console.error("Failed to decrypt Gemini key for user", uid);
        console.error(err);
        return null;
    }
}

export async function getSelectedModel(uid: string): Promise<string> {
    const ai = await readAi(uid);
    return resolveModel(ai.model);
}

export async function saveGeminiKey(uid: string, rawKey: string, status: KeyStatus): Promise<void> {
    const now = new Date().toISOString();
    await userRef(uid).set(
        {
            ai: {
                geminiKeyEnc: encryptSecret(rawKey),
                keyLast4: maskSecret(rawKey),
                keyStatus: status,
                updatedAt: now,
                lastCheckedAt: now,
            },
        },
        { merge: true },
    );
}

export async function updateKeyStatus(uid: string, status: KeyStatus): Promise<void> {
    await userRef(uid).set(
        { ai: { keyStatus: status, lastCheckedAt: new Date().toISOString() } },
        { merge: true },
    );
}

export async function saveSelectedModel(uid: string, model: string): Promise<string> {
    const resolved = resolveModel(model);
    await userRef(uid).set({ ai: { model: resolved } }, { merge: true });
    return resolved;
}

export async function deleteGeminiKey(uid: string): Promise<void> {
    // Firestore field deletes need FieldValue; clear by writing empty + status unset.
    const FieldValue = (await import("firebase-admin")).default.firestore.FieldValue;
    await userRef(uid).set(
        {
            ai: {
                geminiKeyEnc: FieldValue.delete(),
                keyLast4: FieldValue.delete(),
                keyStatus: "unset",
                model: DEFAULT_GEMINI_MODEL,
                updatedAt: new Date().toISOString(),
                lastCheckedAt: FieldValue.delete(),
            },
        },
        { merge: true },
    );
}
