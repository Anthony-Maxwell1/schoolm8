import { db, auth } from "@/lib/firebaseAdmin";

const ENDPOINT_TO_SCOPE = {
    "api/auth/google/*": ["api/auth/google/*"],
    apiAccessLevel1: [
        "api/files/*",
        "api/chat/*",
        "api/auth/google/*",
        "api/auth/onedrive/*",
        "api/canvas/*",
        "api/googleclassroom/*",
        "api/knowledge/*"
    ],
    apiAccessLevel0: ["api/schedule/*", "api/projects/*", "api/notes/*", "api/auth/init/*", "api/auth/universalState/*", "api/lms/*"],
    "api/auth/onedrive/*": ["api/auth/onedrive/*"],
    "api/auth/universalState/*": ["api/auth/universalState/*"],
    "api/canvas/*": ["api/canvas/*"],
    "api/googleclassroom/*": ["api/googleclassroom/*"],
    "api/chat/*": ["api/chat/*"],
    UGCAccessPermitted: ["api/chat/*", "api/knowledge/*"],
    "api/files/*": ["api/files/*"],
    "api/knowledge/*": ["api/knowledge/*"],
    "api/lms/*": ["api/lms/*"],
    "api/notes/*": ["api/notes/*"],
    "api/projects/*": ["api/projects/*"],
    "api/schedule/*": ["api/schedule/*"],
};

export const serverAccessControl = async (uid: string, page: string) => {
    if (!uid || !page) {
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

    const bannedRef = db.doc(`UAC/${page.replaceAll("/", ".")}/banned/${uid}`);
    const allowedRef = db.doc(`UAC/${page.replaceAll("/", ".")}/allowed/${uid}`);
    const allowedCollectionRef = db.collection(`UAC/${page.replaceAll("/", ".")}/allowed`).limit(1);

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

export const assertAccess = async (uid: string, pages: string[]) => {
    for (const page of pages) {
        const res = await serverAccessControl(uid, page);

        if (res.status !== 200) {
            return res;
        }
    }

    return { status: 200 };
};
