"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, getDocs, collection, query, limit, getFirestore } from "firebase/firestore";
import { useAccessControlContext } from "@/context/AccessControlContext";

export const useAccessControl = (page: string) => {
    const { user, loading } = useAccessControlContext();
    const [allowed, setAllowed] = useState<boolean | null>(null);

    useEffect(() => {
        if (loading) return;

        if (!user) {
            setAllowed(false);
            return;
        }

        const checkAccess = async () => {
            const db = getFirestore();

            const bannedRef = doc(db, "UAC", page, "banned", user.uid);
            const allowedRef = doc(db, "UAC", page, "allowed", user.uid);

            const allowedCollectionRef = collection(db, "UAC", page, "allowed");

            const [bannedSnap, allowedSnap, allowedCollectionSnap] = await Promise.all([
                getDoc(bannedRef),
                getDoc(allowedRef),
                getDocs(query(allowedCollectionRef, limit(1))),
            ]);

            // 🚨 Ban overrides everything
            if (bannedSnap.exists()) {
                setAllowed(false);
                return;
            }

            const allowlistExists = !allowedCollectionSnap.empty;

            // ✅ If no allowlist exists → allow everyone
            if (!allowlistExists) {
                setAllowed(true);
                return;
            }

            // ✅ Otherwise must be explicitly allowed
            if (allowedSnap.exists()) {
                setAllowed(true);
                return;
            }

            // ❌ default deny
            setAllowed(false);
        };

        checkAccess();
    }, [user, loading, page]);

    return {
        allowed,
        loading: loading || allowed === null,
    };
};
