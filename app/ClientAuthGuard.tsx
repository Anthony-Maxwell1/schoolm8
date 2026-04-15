"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/authContext";

export default function ClientAuthGuard({ children }: { children: React.ReactNode }) {
    const { user, token, loading } = useAuth();

    useEffect(() => {
        if (loading) return;

        const path = window.location.pathname;

        const isAuthPage = path === "/auth" || path === "/auth/signin" || path === "/auth/signup";

        if (!user && !token && !isAuthPage) {
            window.location.href = "/auth";
        }
    }, [loading, user, token]);

    return children;
}
