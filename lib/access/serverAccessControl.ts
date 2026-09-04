import { db, auth } from "@/lib/firebaseAdmin";
import { cached } from "@/lib/cache";

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
    // "api/user/*": ["api/user/*"],
    "api/timetable/*": ["api/timetable/*"],
    "api/tasks/*": ["api/tasks/*"],
    // "api/auth/onedrive/*": ["api/auth/onedrive/*"],
    // "api/auth/universalState/*": ["api/auth/universalState/*"],
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

const LEAF_PATTERNS = Object.keys(ENDPOINT_TO_SCOPE).filter(
    (key) => key.startsWith("api/") && key.endsWith("/*"),
);

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

export const checkAccessList = async (table: string, uid: string, key: string) => {
    if (!uid || !key) {
        return {
            status: 400,
            body: { error: "Invalid request" },
        };
    }

    const emailVerified = (
        await cached(uid + "-EMAILVERIFIED", async () => ({
            verified: (await auth.getUser(uid)).emailVerified,
        }))
    ).verified;

    if (!emailVerified) {
        return {
            status: 403,
            body: { error: "Please verify your email before accessing this page" },
        };
    }

    const normalizedKey = key.replaceAll("/", ".");
    const bannedRef = db.doc(`${table}/${normalizedKey}/banned/${uid}`);
    const allowedRef = db.doc(`${table}/${normalizedKey}/allowed/${uid}`);
    const allowedCollectionRef = db.collection(`${table}/${normalizedKey}/allowed`).limit(1);

    const [bannedResult, allowedResult, allowedCollectionResult] = await Promise.all([
        cached(bannedRef.path, async () => ({ data: await bannedRef.get() })) as Promise<{
            data: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>;
        }>,
        cached(allowedRef.path, async () => ({ data: await allowedRef.get() })) as Promise<{
            data: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>;
        }>,
        cached(`${table}/${normalizedKey}/allowed`, async () => ({
            data: await allowedCollectionRef.get(),
        })) as Promise<{
            data: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>;
        }>,
    ]);

    const bannedSnap = bannedResult.data;
    const allowedSnap = allowedResult.data;
    const allowedCollectionSnap = allowedCollectionResult.data;

    if (bannedSnap.exists) {
        return {
            status: 401,
            body: { error: "User is banned from this page" },
        };
    }

    const allowlistExists = !allowedCollectionSnap.empty;

    if (!allowlistExists) {
        return { status: 200 };
    }

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
