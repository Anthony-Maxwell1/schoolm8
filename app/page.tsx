"use client";

import { useEffect } from "react";
import { useAccessControl } from "@/lib/access/useAccessControl";
import { useRouter } from "next/navigation";

export default function Home() {
    const { allowed, loading } = useAccessControl("home");
    const router = useRouter();

    useEffect(() => {
        if (!loading && allowed) {
            router.replace("/dashboard");
        }
    }, [allowed, loading, router]);

    if (loading) {
        return <div className="min-h-screen" />;
    }

    if (!allowed) {
        return <div>Unauthorized</div>;
    }

    return <div></div>;
}
