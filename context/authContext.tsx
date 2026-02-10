"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    token: string | null;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    token: null,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                const idToken = await firebaseUser.getIdToken();
                setToken(idToken);
            } else {
                setToken(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return <AuthContext.Provider value={{ user, loading, token }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
