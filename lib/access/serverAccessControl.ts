import { getFirestore } from "firebase-admin/firestore";

export const serverAccessControl = async (uid: string, page: string) => {
    const db = getFirestore();

    const bannedRef = db.doc(`UAC/${page}/banned/${uid}`);
    const allowedRef = db.doc(`UAC/${page}/allowed/${uid}`);
    const allowedCollectionRef = db.collection(`UAC/${page}/allowed`).limit(1);

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
