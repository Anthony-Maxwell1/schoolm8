"use client";

import { useEffect, useMemo, useState } from "react";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

import { BlockNoteEditor, PartialBlock } from "@blocknote/core";

import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
export type KnowledgeBasePage = {
    id: string;
    title: string;
    blocks: PartialBlock[];
    children: KnowledgeBasePage[];
};

export type KnowledgeBase = {
    pages: KnowledgeBasePage[];
};

type Props = {
    knowledgeBase: KnowledgeBase;
    setKnowledgeBase: (kb: KnowledgeBase) => void;
};

export default function KnowledgeBaseEditor({ knowledgeBase, setKnowledgeBase }: Props) {
    const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

    // Get first page automatically
    useEffect(() => {
        if (!selectedPageId && knowledgeBase.pages.length > 0) {
            setSelectedPageId(knowledgeBase.pages[0].id);
        }
    }, [knowledgeBase.pages, selectedPageId]);

    const selectedPage = useMemo(() => {
        return findPageById(knowledgeBase.pages, selectedPageId);
    }, [knowledgeBase.pages, selectedPageId]);

    if (!selectedPage) {
        return <div className="flex h-screen items-center justify-center">No page selected</div>;
    }

    return (
        <div className="flex h-screen overflow-hidden bg-white">
            {/* Sidebar */}
            <div className="w-72 border-r border-zinc-200 overflow-y-auto p-3">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Pages</h2>

                    <button
                        className="rounded-lg bg-black px-3 py-1 text-sm text-white"
                        onClick={() => {
                            const newPage: KnowledgeBasePage = {
                                id: crypto.randomUUID(),
                                title: "Untitled",
                                blocks: [
                                    {
                                        type: "paragraph",
                                        content: [],
                                    },
                                ],
                                children: [],
                            };

                            setKnowledgeBase({
                                ...knowledgeBase,
                                pages: [...knowledgeBase.pages, newPage],
                            });

                            setSelectedPageId(newPage.id);
                        }}
                    >
                        +
                    </button>
                </div>

                <PageTree
                    pages={knowledgeBase.pages}
                    selectedPageId={selectedPageId}
                    setSelectedPageId={setSelectedPageId}
                    knowledgeBase={knowledgeBase}
                    setKnowledgeBase={setKnowledgeBase}
                    level={0}
                />
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-hidden">
                <PageEditor
                    key={selectedPage.id}
                    page={selectedPage}
                    onChange={(updatedPage) => {
                        const updatedPages = updatePageById(
                            knowledgeBase.pages,
                            updatedPage.id,
                            updatedPage,
                        );

                        setKnowledgeBase({
                            ...knowledgeBase,
                            pages: updatedPages,
                        });
                    }}
                />
            </div>
        </div>
    );
}

function PageEditor({
    page,
    onChange,
}: {
    page: KnowledgeBasePage;
    onChange: (page: KnowledgeBasePage) => void;
}) {
    const editor = useCreateBlockNote({
        initialContent: page.blocks,
    });

    useEffect(() => {
        const save = async () => {
            const blocks = editor.document;

            onChange({
                ...page,
                blocks,
            });
        };

        editor.onEditorContentChange(save);
    }, [editor, onChange, page]);

    return (
        <div className="flex h-full flex-col">
            {/* Title */}
            <div className="border-b border-zinc-200 p-4">
                <input
                    value={page.title}
                    onChange={(e) =>
                        onChange({
                            ...page,
                            title: e.target.value,
                        })
                    }
                    placeholder="Untitled"
                    className="w-full border-none text-3xl font-bold outline-none"
                />
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-y-auto p-6">
                <BlockNoteView editor={editor} theme="light" />
            </div>
        </div>
    );
}

function PageTree({
    pages,
    selectedPageId,
    setSelectedPageId,
    knowledgeBase,
    setKnowledgeBase,
    level,
}: {
    pages: KnowledgeBasePage[];
    selectedPageId: string | null;
    setSelectedPageId: (id: string) => void;
    knowledgeBase: KnowledgeBase;
    setKnowledgeBase: (kb: KnowledgeBase) => void;
    level: number;
}) {
    return (
        <div className="space-y-1">
            {pages.map((page) => (
                <div key={page.id}>
                    <div
                        className={`group flex items-center rounded-lg px-2 py-1 cursor-pointer hover:bg-zinc-100 ${
                            selectedPageId === page.id ? "bg-zinc-100" : ""
                        }`}
                        style={{
                            paddingLeft: `${level * 16 + 8}px`,
                        }}
                        onClick={() => setSelectedPageId(page.id)}
                    >
                        <span className="flex-1 truncate text-sm">{page.title || "Untitled"}</span>

                        <button
                            className="opacity-0 group-hover:opacity-100 text-xs text-zinc-500 hover:text-black"
                            onClick={(e) => {
                                e.stopPropagation();

                                const child: KnowledgeBasePage = {
                                    id: crypto.randomUUID(),
                                    title: "Untitled",
                                    blocks: [
                                        {
                                            type: "paragraph",
                                            content: [],
                                        },
                                    ],
                                    children: [],
                                };

                                const updatedPages = addChildPage(
                                    knowledgeBase.pages,
                                    page.id,
                                    child,
                                );

                                setKnowledgeBase({
                                    ...knowledgeBase,
                                    pages: updatedPages,
                                });

                                setSelectedPageId(child.id);
                            }}
                        >
                            +
                        </button>
                    </div>

                    {page.children.length > 0 && (
                        <PageTree
                            pages={page.children}
                            selectedPageId={selectedPageId}
                            setSelectedPageId={setSelectedPageId}
                            knowledgeBase={knowledgeBase}
                            setKnowledgeBase={setKnowledgeBase}
                            level={level + 1}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}

function findPageById(pages: KnowledgeBasePage[], id: string | null): KnowledgeBasePage | null {
    for (const page of pages) {
        if (page.id === id) {
            return page;
        }

        const child = findPageById(page.children, id);

        if (child) {
            return child;
        }
    }

    return null;
}

function updatePageById(
    pages: KnowledgeBasePage[],
    id: string,
    updatedPage: KnowledgeBasePage,
): KnowledgeBasePage[] {
    return pages.map((page) => {
        if (page.id === id) {
            return updatedPage;
        }

        return {
            ...page,
            children: updatePageById(page.children, id, updatedPage),
        };
    });
}

function addChildPage(
    pages: KnowledgeBasePage[],
    parentId: string,
    child: KnowledgeBasePage,
): KnowledgeBasePage[] {
    return pages.map((page) => {
        if (page.id === parentId) {
            return {
                ...page,
                children: [...page.children, child],
            };
        }

        return {
            ...page,
            children: addChildPage(page.children, parentId, child),
        };
    });
}
