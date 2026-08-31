"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, User, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";

// authContext.tsx
import { setAuthState } from "@/lib/authStore";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    token: string | null;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    token: null,
    signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const signOut = async () => {
        await firebaseSignOut(auth);
        try {
            await fetch("/api/auth/session", { method: "DELETE" });
        } catch (err) {
            console.error("Failed to clear session cookie:", err);
        }
        // onAuthStateChanged will handle clearing user + token
    };

    useEffect(() => {
        setAuthState(token, loading);
    }, [token, loading]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                const idToken = await firebaseUser.getIdToken();
                setToken(idToken);
                // Middleware protects page navigations with a session cookie
                // (it can't see the client-side Firebase ID token), so keep
                // one alive for as long as the user is signed in.
                try {
                    await fetch("/api/auth/session", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ idToken }),
                    });
                } catch (err) {
                    console.error("Failed to establish session cookie:", err);
                }
            } else {
                setToken(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, token, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
