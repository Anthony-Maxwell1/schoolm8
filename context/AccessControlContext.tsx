"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";

type AccessControlContextType = {
    user: User | null;
    loading: boolean;
};

const AccessControlContext = createContext<AccessControlContextType>({
    user: null,
    loading: true,
});

export const AccessControlProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const auth = getAuth();

        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setLoading(false);
        });

        return () => unsub();
    }, []);

    return (
        <AccessControlContext.Provider value={{ user, loading }}>
            {children}
        </AccessControlContext.Provider>
    );
};

export const useAccessControlContext = () => useContext(AccessControlContext);
