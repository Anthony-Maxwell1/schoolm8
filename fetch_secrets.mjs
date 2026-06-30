#!/usr/bin/env node
/**
 *
 * USE_GSM = true
 *
 * Auth (pick one — checked in this order):
 *   1. GSM_KEY_JSON='{"type":"service_account",...}'
 *        Raw service account key JSON as a string.
 *   2. GSM_KEY_FILE=/path/to/key.json
 *   3. (neither set) Application Default Credentials:
 *        - local dev: authenticate using gcloud, like: `gcloud auth application-default login`, only once.
 *        - GCP infra (Cloud Run/GKE/Compute): attached service account, nothing to config
 *
 * Required:
 *   GSM_PROJECT_ID=your-gcp-project-id
 *   GSM_SECRETS=DATABASE_URL,STRIPE_SECRET_KEY,NEXT_PUBLIC_API_URL
 *     Comma separated. Each name must match a Secret Manager secret ID.
 *
 * Optional, for if env var name and the actual GSM secret ID differ, which is unlikely.:
 *   GSM_SECRETS_MAP=ENV_VAR_NAME:secret-id,OTHER_VAR:other-secret-id
 */

import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { parse as parseEnv } from "dotenv";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const ENV_LOCAL_PATH = path.resolve(process.cwd(), ".env.local");
const MANAGED_START = "# --- BEGIN GSM MANAGED SECRETS (auto-generated, do not edit) ---";
const MANAGED_END = "# --- END GSM MANAGED SECRETS ---";

function readEnvLocal() {
    if (!existsSync(ENV_LOCAL_PATH)) return { raw: "", parsed: {} };
    const raw = readFileSync(ENV_LOCAL_PATH, "utf8");
    return { raw, parsed: parseEnv(raw) };
}

function stripManagedBlock(raw) {
    const start = raw.indexOf(MANAGED_START);
    const end = raw.indexOf(MANAGED_END);
    if (start === -1 || end === -1) return raw.trimEnd();
    return (raw.slice(0, start) + raw.slice(end + MANAGED_END.length)).trim();
}

function serializeManagedBlock(secrets) {
    const lines = Object.entries(secrets).map(([key, value]) => {
        const needsQuotes = /\s|#|^$/.test(value);
        const safeValue = needsQuotes ? `"${value.replace(/"/g, '\\"')}"` : value;
        return `${key}=${safeValue}`;
    });
    return [MANAGED_START, ...lines, MANAGED_END].join("\n");
}

function buildSecretMap() {
    const map = {};
    if (process.env.GSM_SECRETS) {
        for (const name of process.env.GSM_SECRETS.split(",")
            .map((s) => s.trim())
            .filter(Boolean)) {
            map[name] = name;
        }
    }
    if (process.env.GSM_SECRETS_MAP) {
        for (const pair of process.env.GSM_SECRETS_MAP.split(",")
            .map((s) => s.trim())
            .filter(Boolean)) {
            const [envVar, secretId] = pair.split(":").map((s) => s.trim());
            if (envVar && secretId) map[envVar] = secretId;
        }
    }
    return map;
}

function buildClient(projectId) {
    if (process.env.GSM_KEY_JSON) {
        const credentials = JSON.parse(process.env.GSM_KEY_JSON);
        return new SecretManagerServiceClient({ credentials, projectId });
    }
    if (process.env.GSM_KEY_FILE) {
        return new SecretManagerServiceClient({ keyFilename: process.env.GSM_KEY_FILE, projectId });
    }
    return new SecretManagerServiceClient({ projectId });
}

async function main() {
    const { raw, parsed } = readEnvLocal();

    const useGsm = (process.env.USE_GSM ?? parsed.USE_GSM ?? "false").toLowerCase() === "true";
    if (!useGsm) {
        console.log('[load-secrets] USE_GSM is not "true" — skipping Secret Manager fetch.');
        return;
    }

    const projectId = process.env.GSM_PROJECT_ID ?? parsed.GSM_PROJECT_ID;
    if (!projectId) {
        console.error("[load-secrets] USE_GSM=true but GSM_PROJECT_ID is not set. Aborting.");
        process.exit(1);
    }
    if (parsed.GSM_SECRETS && !process.env.GSM_SECRETS)
        process.env.GSM_SECRETS = parsed.GSM_SECRETS;
    if (parsed.GSM_SECRETS_MAP && !process.env.GSM_SECRETS_MAP)
        process.env.GSM_SECRETS_MAP = parsed.GSM_SECRETS_MAP;
    if (parsed.GSM_KEY_FILE && !process.env.GSM_KEY_FILE)
        process.env.GSM_KEY_FILE = parsed.GSM_KEY_FILE;

    const secretMap = buildSecretMap();
    const names = Object.keys(secretMap);
    if (names.length === 0) {
        console.error(
            "[load-secrets] USE_GSM=true but no secrets listed in GSM_SECRETS / GSM_SECRETS_MAP. Aborting.",
        );
        process.exit(1);
    }

    const client = buildClient(projectId);
    const resolved = {};

    console.log(`[load-secrets] Fetching ${names.length} secret(s) from project "${projectId}"...`);

    await Promise.all(
        names.map(async (envVar) => {
            const secretId = secretMap[envVar];
            const versionName = `projects/${projectId}/secrets/${secretId}/versions/latest`;
            try {
                const [version] = await client.accessSecretVersion({ name: versionName });
                resolved[envVar] = version.payload.data.toString("utf8");
                console.log(`[load-secrets]  \u2713 ${envVar} <- ${secretId}`);
            } catch (err) {
                console.error(`[load-secrets]  \u2717 ${envVar} <- ${secretId}: ${err.message}`);
                throw err;
            }
        }),
    );

    const cleanedRaw = stripManagedBlock(raw);
    const newContent = `${cleanedRaw}${cleanedRaw ? "\n\n" : ""}${serializeManagedBlock(resolved)}\n`;
    writeFileSync(ENV_LOCAL_PATH, newContent, "utf8");

    console.log(`[load-secrets] Wrote ${names.length} secret(s) into ${ENV_LOCAL_PATH}`);
}

main().catch((err) => {
    console.error("[load-secrets] Failed:", err);
    process.exit(1);
});
