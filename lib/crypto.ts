/**
 * lib/crypto.ts
 *
 * Server-only symmetric encryption for sensitive per-user secrets
 * (Gemini API keys, Edumate passwords, etc.) stored at rest in Firestore.
 *
 * Uses AES-256-GCM. The 32-byte key is derived from the `ENCRYPTION_KEY`
 * environment variable via scrypt, so any sufficiently random string works
 * as the configured secret. NEVER import this from a client component.
 *
 * Stored format (string):  v1:<iv_b64>:<tag_b64>:<ciphertext_b64>
 */

import {
    createCipheriv,
    createDecipheriv,
    randomBytes,
    scryptSync,
    timingSafeEqual,
} from "crypto";

const VERSION = "v1";
const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12; // GCM standard nonce length
const KEY_BYTES = 32; // AES-256
// Static salt: the secret is the ENCRYPTION_KEY env var, not the salt.
const KEY_SALT = "schoolm8::secret-encryption::v1";

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
    if (cachedKey) return cachedKey;

    const secret = process.env.ENCRYPTION_KEY;
    if (!secret || secret.length < 16) {
        throw new Error(
            "ENCRYPTION_KEY is not configured (or is too short). Set a strong random value " +
                "in your environment before using encrypted secrets. " +
                "Generate one with: node -e \"console.log(require('crypto').randomBytes(48).toString('base64'))\"",
        );
    }

    cachedKey = scryptSync(secret, KEY_SALT, KEY_BYTES);
    return cachedKey;
}

/** Encrypt a UTF-8 string. Returns an opaque, self-describing token. */
export function encryptSecret(plaintext: string): string {
    const key = getKey();
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, key, iv);

    const ciphertext = Buffer.concat([
        cipher.update(plaintext, "utf8"),
        cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    return [
        VERSION,
        iv.toString("base64"),
        tag.toString("base64"),
        ciphertext.toString("base64"),
    ].join(":");
}

/** Decrypt a token produced by {@link encryptSecret}. Throws if tampered or malformed. */
export function decryptSecret(token: string): string {
    const parts = token.split(":");
    if (parts.length !== 4 || parts[0] !== VERSION) {
        throw new Error("Malformed or unsupported encrypted secret");
    }

    const key = getKey();
    const iv = Buffer.from(parts[1], "base64");
    const tag = Buffer.from(parts[2], "base64");
    const ciphertext = Buffer.from(parts[3], "base64");

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    const plaintext = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
    ]);
    return plaintext.toString("utf8");
}

/** Whether a value looks like one of our encrypted tokens (vs. legacy plaintext). */
export function isEncrypted(value: unknown): value is string {
    return typeof value === "string" && value.startsWith(`${VERSION}:`);
}

/**
 * Show only the last few characters of a secret for UI confirmation,
 * e.g. "AIza••••••••3xQ". Never returns the full secret.
 */
export function maskSecret(plaintext: string, visibleStart = 4, visibleEnd = 3): string {
    if (plaintext.length <= visibleStart + visibleEnd) {
        return "•".repeat(Math.max(plaintext.length, 4));
    }
    return (
        plaintext.slice(0, visibleStart) +
        "•".repeat(8) +
        plaintext.slice(plaintext.length - visibleEnd)
    );
}

/** Constant-time string comparison helper for tokens/secrets. */
export function safeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
}
