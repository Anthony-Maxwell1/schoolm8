"use client";

import { useEffect, useState } from "react";

import KnowledgeBaseEditor, { KnowledgeBase } from "@/components/KnowledgeBase";
import { useAuth } from "@/context/authContext";

const STORAGE_KEY = "schoolm8_knowledge_cache";

const defaultKnowledgeBase: KnowledgeBase = {
    pages: [
        {
            id: crypto.randomUUID(),
            title: "Welcome",
            blocks: [
                {
                    type: "paragraph",
                    content: [],
                },
            ],
            children: [],
        },
    ],
};

export default function KnowledgeBaseApp() {
    const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase>(defaultKnowledgeBase);

    const { token } = useAuth();

    const [loading, setLoading] = useState(true);

    /**
     * 1. Load from localStorage immediately (instant UI)
     */
    useEffect(() => {
        try {
            const cached = localStorage.getItem(STORAGE_KEY);

            if (cached) {
                setKnowledgeBase(JSON.parse(cached));
            }
        } catch (err) {
            console.error("Failed reading cache", err);
        }
    }, []);

    /**
     * 2. Fetch from server and override cache
     */
    useEffect(() => {
        const loadFromServer = async () => {
            try {
                const res = await fetch("/api/knowledge/get", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const json = await res.json();

                if (json?.data) {
                    setKnowledgeBase(json.data);

                    // update cache with server truth
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(json.data));
                }
            } catch (err) {
                console.error("Server load failed", err);
            } finally {
                setLoading(false);
            }
        };

        loadFromServer();
    }, []);

    /**
     * 3. Update both localStorage + server
     */
    const updateKnowledgeBase = async (kb: KnowledgeBase) => {
        setKnowledgeBase(kb);

        // always update cache instantly
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(kb));
        } catch (err) {
            console.error("Cache write failed", err);
        }

        // sync to server (non-blocking)
        fetch("/api/knowledge/set", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                content: kb,
            }),
        }).catch((err) => {
            console.error("Server save failed", err);
        });
    };

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    return (
        <KnowledgeBaseEditor knowledgeBase={knowledgeBase} setKnowledgeBase={updateKnowledgeBase} />
    );
}
