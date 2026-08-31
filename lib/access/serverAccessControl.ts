import { db, auth } from "@/lib/firebaseAdmin";

/**
 * Maps every API endpoint pattern to the "scope" identifiers whose
 * ban/allow lists gate it. A leaf entry (e.g. "api/user/*") always lists
 * itself; the various apiAccessLevel-N and UGCAccessPermitted "groups"
 * bundle several leaves together so a single ban/allow decision can be
 * made for a whole tier at once.
 *
 * This is also the source of truth `getRequiredScopesForApiPath` uses to
 * figure out, purely from a request path, which scopes `middleware.ts` must
 * check -- so this table now doubles as the OAuth "requestable scopes" list
 * (see lib/oauth/scopes.ts).
 */
export const ENDPOINT_TO_SCOPE = {
    "api/auth/google/*": ["api/auth/google/*"],
    apiAccessLevel1: [
        "api/files/*",
        "api/chat/*",
        "api/auth/google/*",
        "api/auth/onedrive/*",
        "api/canvas/*",
        "api/googleclassroom/*",
        "api/knowledge/*",
        "api/themes/*",
    ],
    "apiAccessLevel-1": ["api/search/*"],
    apiAccessLevel0: [
        "api/schedule/*",
        "api/projects/*",
        "api/notes/*",
        "api/auth/init/*",
        "api/auth/universalState/*",
        "api/lms/*",
        "api/tasks/*",
        "api/timetable/*",
        "api/user/*",
    ],
    "api/user/*": ["api/user/*"],
    "api/timetable/*": ["api/timetable/*"],
    "api/tasks/*": ["api/tasks/*"],
    "api/auth/onedrive/*": ["api/auth/onedrive/*"],
    "api/auth/universalState/*": ["api/auth/universalState/*"],
    "api/canvas/*": ["api/canvas/*"],
    "api/googleclassroom/*": ["api/googleclassroom/*"],
    "api/chat/*": ["api/chat/*"],
    UGCAccessPermitted: ["api/chat/*", "api/knowledge/*", "api/themes/*"],
    "api/files/*": ["api/files/*"],
    "api/knowledge/*": ["api/knowledge/*"],
    "api/lms/*": ["api/lms/*"],
    "api/notes/*": ["api/notes/*"],
    "api/projects/*": ["api/projects/*"],
    "api/schedule/*": ["api/schedule/*"],
    "api/search/*": ["api/search/*"],
    "api/themes/*": ["api/themes/*"],
} satisfies Record<string, string[]>;

/** The leaf (single-endpoint) patterns, e.g. "api/user/*", "api/chat/*". */
const LEAF_PATTERNS = Object.keys(ENDPOINT_TO_SCOPE).filter(
    (key) => key.startsWith("api/") && key.endsWith("/*"),
);

/**
 * Given a request pathname (with or without a leading slash, with or
 * without a leading "/api"), returns the full list of scope identifiers
 * that must all pass Server Access Control for the request to be allowed --
 * exactly what each route used to pass to `assertAccess` by hand.
 *
 * Returns `[]` for endpoints not present in ENDPOINT_TO_SCOPE at all (e.g.
 * `api/ai/*`, `api/calendar/*`, `api/oauth/*`) -- those are only gated by
 * authentication, not by a ban/allow list, matching their pre-middleware
 * behaviour.
 */
export function getRequiredScopesForApiPath(pathname: string): string[] {
    const normalized = pathname.replace(/^\/+/, ""); // "api/user/get"

    let leaf: string | null = null;
    for (const pattern of LEAF_PATTERNS) {
        const prefix = pattern.slice(0, -1); // strip trailing "*"
        if (normalized.startsWith(prefix) && (!leaf || pattern.length > leaf.length)) {
            leaf = pattern;
        }
    }

    if (!leaf) return [];

    const groups = Object.entries(ENDPOINT_TO_SCOPE)
        .filter(([key, members]) => key !== leaf && (members as string[]).includes(leaf as string))
        .map(([key]) => key);

    return [leaf, ...groups];
}

/**
 * The generic ban/allow-list check, parameterised over which Firestore
 * "table" (top-level collection) to read from. `serverAccessControl` below
 * uses table "UAC" for API scopes; `pageAccessControl` uses a separate
 * "PageAC" table for whole-page access control, per the same rules.
 */
export const checkAccessList = async (table: string, uid: string, key: string) => {
    if (!uid || !key) {
        return {
            status: 400,
            body: { error: "Invalid request" },
        };
    }

    if (!(await auth.getUser(uid)).emailVerified) {
        return {
            status: 403,
            body: { error: "Please verify your email before accessing this page" },
        };
    }

    const normalizedKey = key.replaceAll("/", ".");
    const bannedRef = db.doc(`${table}/${normalizedKey}/banned/${uid}`);
    const allowedRef = db.doc(`${table}/${normalizedKey}/allowed/${uid}`);
    const allowedCollectionRef = db.collection(`${table}/${normalizedKey}/allowed`).limit(1);

    const [bannedSnap, allowedSnap, allowedCollectionSnap] = await Promise.all([
        bannedRef.get(),
        allowedRef.get(),
        allowedCollectionRef.get(),
    ]);

    // 🚨 Ban always wins
    if (bannedSnap.exists) {
        return {
            status: 401,
            body: { error: "User is banned from this page" },
        };
    }

    const allowlistExists = !allowedCollectionSnap.empty;

    // ✅ No allowlist → open access
    if (!allowlistExists) {
        return { status: 200 };
    }

    // ✅ Otherwise must be explicitly allowed
    if (!allowedSnap.exists) {
        return {
            status: 401,
            body: { error: "Unauthorized" },
        };
    }

    return { status: 200 };
};

export const serverAccessControl = async (uid: string, page: string) => {
    return checkAccessList("UAC", uid, page);
};

export const assertAccess = async (uid: string, pages: string[]) => {
    for (const page of pages) {
        const res = await serverAccessControl(uid, page);

        if (res.status !== 200) {
            return res;
        }
    }

    return { status: 200 };
};
