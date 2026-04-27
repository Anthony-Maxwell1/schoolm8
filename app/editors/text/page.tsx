"use client";
import dynamic from "next/dynamic";
import { useAccessControl } from "@/lib/access/useAccessControl";

const TextEditor = dynamic(() => import("@/components/tinyMCE"), { ssr: false });

export default function Page() {
    const { allowed, loading } = useAccessControl("editors/text");

    if (loading) return null;
    if (!allowed) return <div>Unauthorized</div>;

    return <TextEditor />;
}
