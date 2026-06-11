"use client";

import { useEffect, useRef, useState } from "react";

import KnowledgeBaseEditor, {
    KnowledgeBase,
    KnowledgeBasePage,
} from "@/components/KnowledgeBase";
import { useAuth } from "@/context/authContext";
import { useCss } from "@/lib/css";

const STORAGE_KEY = "schoolm8_knowledge_cache";

export type StoredPage = KnowledgeBasePage & {
    updatedAt?: number;
};

const defaultKnowledgeBase: KnowledgeBase = {
    pages: [],
};

function flattenPages(
    pages: StoredPage[],
    map = new Map<string, StoredPage>(),
) {
    for (const page of pages) {
        map.set(page.id, page);

        if (page.children?.length) {
            flattenPages(page.children as StoredPage[], map);
        }
    }

    return map;
}

function touchPage(page: StoredPage): StoredPage {
    return {
        ...page,
        updatedAt: Date.now(),
    };
}

function mergeKnowledgeBases(
    localKb: KnowledgeBase,
    serverKb: KnowledgeBase,
): KnowledgeBase {
    const localMap = flattenPages(
        localKb.pages as StoredPage[],
    );

    const serverMap = flattenPages(
        serverKb.pages as StoredPage[],
    );

    const mergedMap = new Map<string, StoredPage>();

    const allIds = new Set([
        ...localMap.keys(),
        ...serverMap.keys(),
    ]);

    for (const id of allIds) {
        const local = localMap.get(id);
        const server = serverMap.get(id);

        if (!local) {
            mergedMap.set(id, server!);
            continue;
        }

        if (!server) {
            mergedMap.set(id, local);
            continue;
        }

        mergedMap.set(
            id,
            (local.updatedAt ?? 0) >=
                (server.updatedAt ?? 0)
                ? local
                : server,
        );
    }

    const seen = new Set<string>();

    const mergeTree = (
        localPages: StoredPage[],
        serverPages: StoredPage[],
    ): StoredPage[] => {
        const result: StoredPage[] = [];

        const ids = new Set([
            ...localPages.map((p) => p.id),
            ...serverPages.map((p) => p.id),
        ]);

        for (const id of ids) {
            const page = mergedMap.get(id);

            if (!page || seen.has(id)) continue;

            seen.add(id);

            const local =
                localMap.get(id);

            const server =
                serverMap.get(id);

            result.push({
                ...page,
                children: mergeTree(
                    (local?.children ??
                        []) as StoredPage[],
                    (server?.children ??
                        []) as StoredPage[],
                ),
            });
        }

        return result;
    };

    return {
        pages: mergeTree(
            localKb.pages as StoredPage[],
            serverKb.pages as StoredPage[],
        ),
    };
}

export default function KnowledgeBaseApp() {
    const [knowledgeBase, setKnowledgeBase] =
        useState<KnowledgeBase>(defaultKnowledgeBase);

    const statusBarRef =
        useRef<HTMLParagraphElement>(null);

    const { loading: authLoading, token } =
        useAuth();

    const { css } = useCss();
    const style = css.app.knowledgeBase;

    const hasLoadedServer =
        useRef(false);

    useEffect(() => {
        try {
            const cached =
                localStorage.getItem(
                    STORAGE_KEY,
                );

            if (cached) {
                setKnowledgeBase(
                    JSON.parse(cached),
                );
            }
        } catch (err) {
            console.error(
                "Failed reading cache",
                err,
            );
            if (statusBarRef.current) {
                statusBarRef.current.textContent =
                    "Failed to read cache.";
            }
        }
    }, []);

    useEffect(() => {
        if (
            authLoading ||
            !token ||
            hasLoadedServer.current
        )
            return;

        hasLoadedServer.current = true;

        (async () => {
            try {
                if (statusBarRef.current) {
                    statusBarRef.current.textContent =
                        "Syncing...";
                }
                const cachedRaw =
                    localStorage.getItem(
                        STORAGE_KEY,
                    );

                const cachedKb =
                    cachedRaw
                        ? JSON.parse(
                            cachedRaw,
                        )
                        : defaultKnowledgeBase;

                const res = await fetch(
                    "/api/knowledge/get",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    },
                );

                const json =
                    await res.json();

                const serverKb =
                    json?.data ??
                    defaultKnowledgeBase;

                const merged =
                    mergeKnowledgeBases(
                        cachedKb,
                        serverKb,
                    );

                setKnowledgeBase(
                    merged,
                );

                localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify(
                        merged,
                    ),
                );
                if (statusBarRef.current) {
                    statusBarRef.current.textContent =
                        "Knowledge base loaded.";
                }
                try {
                    await fetch("/api/knowledge/set", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            content: merged,
                        }),
                    });
                } catch (err) {
                    console.error("Server save failed", err);
                    if (statusBarRef.current) {
                        statusBarRef.current.textContent =
                            "Failed to sync with server.";
                    }
                }
            } catch (err) {
                console.error(
                    "Server load failed",
                    err,
                );
                if (statusBarRef.current) {
                    statusBarRef.current.textContent =
                        "Failed to load from server.";
                }
            }
        })();
    }, [token, authLoading]);

    const updateKnowledgeBase =
        async (
            kb: KnowledgeBase,
        ) => {
            setKnowledgeBase(kb);

            try {
                localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify(kb),
                );
            } catch (err) {
                console.error(
                    "Cache write failed",
                    err,
                );
            }

            fetch(
                "/api/knowledge/set",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        content: kb,
                    }),
                },
            ).catch((err) => {
                console.error(
                    "Server save failed",
                    err,
                );
            });
        };

    return (
        <KnowledgeBaseEditor
            knowledgeBase={
                knowledgeBase
            }
            setKnowledgeBase={
                updateKnowledgeBase
            }
            statusBarRef={statusBarRef}
        />
    );
}