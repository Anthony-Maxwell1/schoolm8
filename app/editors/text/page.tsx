"use client";
import dynamic from "next/dynamic";

const TextEditor = dynamic(() => import("@/components/tinyMCE"), { ssr: false });

export default function Page() {
    // if (loading) return null;
    // if (!allowed) return <div>Unauthorized</div>;

    return <TextEditor />;
}
