"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, getDocs, collection, query, limit, getFirestore } from "firebase/firestore";
import { useAccessControlContext } from "@/context/AccessControlContext";
import { useAuth } from "@/context/authContext";

export const useAccessControl = (page: string) => {
    const { user, loading } = useAccessControlContext();
    const { signOut } = useAuth();
    const [allowed, setAllowed] = useState<boolean | null>(null);

    page = page.replaceAll("/", ".");

    useEffect(() => {
        if (loading || !user) return;

        console.log("Checking access for page:", page, "and user:", user?.uid);

        if (!user) {
            setAllowed(false);
            return;
        }

        if (!user.emailVerified) {
            console.error("Email not verified!");
            signOut()
                .then(() => {
                    setAllowed(false);
                })
                .then(() => {
                    window.location.pathname = "/auth/signin";
                });
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
                console.log("Access denied: user is banned");
                return;
            }

            const allowlistExists = !allowedCollectionSnap.empty;

            // ✅ If no allowlist exists → allow everyone
            if (!allowlistExists) {
                setAllowed(true);
                console.log("Access granted: no allowlist, open access");
                return;
            }

            // ✅ Otherwise must be explicitly allowed
            if (allowedSnap.exists()) {
                setAllowed(true);
                return;
            }

            console.log("Access denied: user is not on the allowlist");

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
