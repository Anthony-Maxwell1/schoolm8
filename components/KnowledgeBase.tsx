"use client";

import { useEffect, useMemo, useState } from "react";

// @ts-ignore
import "@blocknote/core/fonts/inter.css";
// @ts-ignore
import "@blocknote/mantine/style.css";

import { PartialBlock, BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import {
    createReactBlockSpec,
    getDefaultReactSlashMenuItems,
    SuggestionMenuController,
    DefaultReactSuggestionItem,
} from "@blocknote/react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import {
    X,
    Plus,
    Tag as TagIcon,
    ExternalLink,
    Database,
    Link as LinkIcon,
    Code,
    FileText,
    Minimize2,
    Maximize2,
    Trash2,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { useAuth } from "@/context/authContext";
import { useRef } from "react";
import { Filter, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { Button, Text, Divider } from "@/components/ui/components";

// ── All types, helpers, block specs, DatabaseBlock, PageLinkBlock,
// EmbedBlock, TagInput, PageEditor, PageTree, and tree utilities are
// unchanged from the original — copy them here verbatim.
// Only KnowledgeBaseEditor (the root export) is modified below.

export type DatabaseEntry = {
    id: string;
    name: string;
    pageContent: PartialBlock[];
    values: Record<string, { type: TagType; value: string }>;
};
export type DatabaseBlockData = {
    title: string;
    columns: { key: string; type: TagType }[];
    entries: DatabaseEntry[];
};
export type PageLinkBlockData = { pageId: string; pageTitle?: string };
export type EmbedBlockData = { url: string; title?: string };
export type KnowledgeBasePage = {
    id: string;
    title: string;
    blocks: PartialBlock[];
    children: KnowledgeBasePage[];
    tags?: string[];
};
export type TagType = "course" | "assignment" | "date" | "class" | "generic" | "number";
export type ParsedTag = { type: TagType; value: string; display: string };

export const parseTag = (tag: string): ParsedTag | null => {
    const match = tag.match(/^([^:]+):(.+)$/);
    if (!match) return null;
    const [, type, value] = match;
    const normalizedType = type.toLowerCase();
    if (!["course", "assignment", "date", "class", "generic", "number"].includes(normalizedType)) return null;
    return { type: normalizedType as TagType, value, display: value };
};
export const formatTag = (type: TagType, value: string): string => `${type}:${value}`;
export const getTagColor = (type: TagType): string => {
    const colors: Record<TagType, string> = {
        course: "bg-blue-100 text-blue-800 border-blue-200",
        assignment: "bg-purple-100 text-purple-800 border-purple-200",
        date: "bg-green-100 text-green-800 border-green-200",
        class: "bg-orange-100 text-orange-800 border-orange-200",
        generic: "bg-gray-100 text-gray-800 border-gray-200",
        number: "bg-pink-100 text-pink-800 border-pink-200",
    };
    return colors[type];
};
export const getTagIcon = (type: TagType): string => {
    const icons: Record<TagType, string> = {
        course: "📚", assignment: "✓", date: "📅", class: "🎓", generic: "🏷️", number: "#",
    };
    return icons[type];
};

function sanitizeBlocks(blocks: PartialBlock[]): PartialBlock[] {
    return blocks.map((block) => ({
        ...block,
        content: Array.isArray((block as any).content) ? (block as any).content : [],
        children: Array.isArray((block as any).children) ? sanitizeBlocks((block as any).children) : [],
    }));
}

// ─── Entry Page Editor ────────────────────────────────────────────────────────
function EntryPageEditor({ entry, onClose, onSave, allPages }: {
    entry: DatabaseEntry; onClose: () => void;
    onSave: (entryId: string, blocks: PartialBlock[]) => void;
    allPages: KnowledgeBasePage[];
}) {
    const schema = useMemo(() => createCustomSchema(allPages), [allPages]);
    const initialContent = useMemo((): PartialBlock[] => {
        if (!entry.pageContent || entry.pageContent.length === 0) return [{ type: "paragraph", content: [] }];
        const sanitized = sanitizeBlocks(entry.pageContent);
        return sanitized.length > 0 ? sanitized : [{ type: "paragraph", content: [] }];
    }, [entry.id]);

    const editor = useCreateBlockNote({ initialContent, schema });

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;
        editor.onEditorContentChange(() => {
            clearTimeout(timeout);
            timeout = setTimeout(() => { onSave(entry.id, editor.document as PartialBlock[]); }, 500);
        });
        return () => { clearTimeout(timeout); };
    }, [editor, entry.id, onSave]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-muted)] shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--color-accent-subtle)] flex items-center justify-center shrink-0">
                        <FileText size={13} className="text-[var(--color-primary)]" />
                    </div>
                    <span className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                        {entry.name || "Untitled"}
                    </span>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--color-muted)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors shrink-0"
                >
                    <X size={15} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto">
                <div className="px-5 py-5">
                    <BlockNoteView editor={editor} theme="light" />
                </div>
            </div>
        </div>
    );
}

// ─── Custom Block Specs (unchanged) ──────────────────────────────────────────
const createDatabaseBlockSpec = (allPages: KnowledgeBasePage[], setRightPanel: (node: React.ReactNode | null) => void) =>
    createReactBlockSpec(
        { type: "database", propSchema: { title: { default: "New Database" }, columnsJson: { default: "[]" }, entriesJson: { default: "[]" } }, content: "none" },
        { render: (props) => { const columns = JSON.parse(props.block.props.columnsJson || "[]"); const entries = JSON.parse(props.block.props.entriesJson || "[]"); return <DatabaseBlock data={{ title: props.block.props.title, columns, entries }} title={props.block.props.title} columns={columns} onChange={(title, columns, entries) => { props.editor.updateBlock(props.block, { type: "database", props: { title, columnsJson: JSON.stringify(columns), entriesJson: JSON.stringify(entries) } }); }} allPages={allPages} setRightPanel={setRightPanel} />; } },
    );

const createPageLinkBlockSpec = (allPages: KnowledgeBasePage[]) =>
    createReactBlockSpec(
        { type: "pageLink", propSchema: { pageId: { default: "" }, pageTitle: { default: "" } }, content: "none" },
        { render: (props) => <PageLinkBlock data={{ pageId: props.block.props.pageId, pageTitle: props.block.props.pageTitle }} onChange={(data) => { props.editor.updateBlock(props.block, { type: "pageLink", props: { pageId: data.pageId, pageTitle: data.pageTitle } }); }} allPages={allPages} /> },
    );

const createEmbedBlockSpec = () =>
    createReactBlockSpec(
        { type: "embed", propSchema: { url: { default: "" }, title: { default: "" } }, content: "none" },
        { render: (props) => <EmbedBlock data={{ url: props.block.props.url, title: props.block.props.title }} onChange={(data) => { props.editor.updateBlock(props.block, { type: "embed", props: { url: data.url, title: data.title } }); }} /> },
    );

const createCustomSchema = (allPages: KnowledgeBasePage[], setRightPanel?: (node: React.ReactNode | null) => void) => {
    const noop = () => { };
    return BlockNoteSchema.create({ blockSpecs: { ...defaultBlockSpecs, database: createDatabaseBlockSpec(allPages, setRightPanel ?? noop)(), pageLink: createPageLinkBlockSpec(allPages)(), embed: createEmbedBlockSpec()() } });
};

// ─── DatabaseBlock, PageLinkBlock, EmbedBlock, TagInput, PageEditor, PageTree
// are all unchanged from the original — paste them here as-is.
// (Omitted from this diff to keep the changeset focused.)
// ─────────────────────────────────────────────────────────────────────────────

function flattenPages(pages: KnowledgeBasePage[], depth = 0): (KnowledgeBasePage & { depth: number })[] {
    return pages.flatMap((page) => [{ ...page, depth }, ...flattenPages(page.children, depth + 1)]);
}

export type KnowledgeBase = { pages: KnowledgeBasePage[] };
type Props = { knowledgeBase: KnowledgeBase; setKnowledgeBase: (kb: KnowledgeBase) => void; statusBarRef: React.RefObject<HTMLParagraphElement | null> };

// ─── Root Component ───────────────────────────────────────────────────────────

export default function KnowledgeBaseEditor({ knowledgeBase, setKnowledgeBase, statusBarRef }: Props) {
    const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
    const [sidebarExpanded, setSidebarExpanded] = useState(true);
    const [rightPanel, setRightPanel] = useState<React.ReactNode | null>(null);
    const [rightPanelExpanded, setRightPanelExpanded] = useState(false);

    const handleSetRightPanel = (node: React.ReactNode | null) => {
        if (!node) setRightPanelExpanded(false);
        setRightPanel(node);
    };

    const selectedPage = useMemo(() => {
        if (!selectedPageId) return null;
        return findPageById(knowledgeBase.pages, selectedPageId);
    }, [knowledgeBase.pages, selectedPageId]);

    return (
        <div className="flex h-screen overflow-hidden bg-[var(--color-surface)]">

            {/* ── Sidebar ── */}
            <div className={`${sidebarExpanded ? "w-64" : "w-14"} border-r border-[var(--color-border-subtle)] overflow-y-auto bg-[var(--color-surface-raised)] flex flex-col transition-all duration-300 shrink-0`}>

                {/* Sidebar header */}
                <div className="sticky top-0 bg-[var(--color-surface-raised)] border-b border-[var(--color-border-subtle)] px-4 py-4 z-10">
                    <div className="flex items-center justify-between">
                        {sidebarExpanded && (
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="h-7 w-7 shrink-0 rounded-[var(--radius-md)] bg-[var(--color-accent-subtle)] flex items-center justify-center">
                                    <TagIcon size={15} className="text-[var(--color-primary)]" />
                                </div>
                                <span className="text-sm font-semibold text-[var(--color-text-primary)] whitespace-nowrap">
                                    Knowledge Base
                                </span>
                            </div>
                        )}
                        <button
                            onClick={() => setSidebarExpanded(!sidebarExpanded)}
                            className={`p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--color-muted)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors ${sidebarExpanded ? "ml-auto" : "mx-auto"}`}
                        >
                            <ChevronLeft
                                size={16}
                                className={`transition-transform duration-300 ${sidebarExpanded ? "" : "rotate-180"}`}
                            />
                        </button>
                    </div>
                </div>

                {/* Page list */}
                {sidebarExpanded && (
                    <div className="flex-1 overflow-y-auto px-2 py-3">
                        <p className="mb-2 px-2 text-[11px] font-medium tracking-[0.1em] uppercase text-[var(--color-text-tertiary)]">
                            Pages
                        </p>
                        <PageTree
                            pages={knowledgeBase.pages}
                            selectedPageId={selectedPageId}
                            setSelectedPageId={(id) => { setSelectedPageId(id); setRightPanel(null); }}
                            knowledgeBase={knowledgeBase}
                            setKnowledgeBase={setKnowledgeBase}
                            level={0}
                        />
                    </div>
                )}

                {/* New page button */}
                {sidebarExpanded && (
                    <div className="border-t border-[var(--color-border-subtle)] p-3 bg-[var(--color-surface-raised)] sticky bottom-0">
                        <Button
                            variant="primary"
                            size="sm"
                            className="w-full"
                            leftIcon={<Plus size={15} />}
                            onClick={() => {
                                const newPage: KnowledgeBasePage = {
                                    id: crypto.randomUUID(),
                                    title: "Untitled",
                                    blocks: [{ type: "paragraph", content: [] }],
                                    children: [],
                                };
                                setKnowledgeBase({ ...knowledgeBase, pages: [...knowledgeBase.pages, newPage] });
                                setSelectedPageId(newPage.id);
                                setRightPanel(null);
                            }}
                        >
                            New page
                        </Button>
                    </div>
                )}

                {/* Collapsed: icon-only new page */}
                {!sidebarExpanded && (
                    <div className="border-t border-[var(--color-border-subtle)] p-2 sticky bottom-0">
                        <Button
                            variant="ghost"
                            size="sm"
                            iconOnly
                            aria-label="New page"
                            leftIcon={<Plus size={15} />}
                            className="w-full"
                            onClick={() => {
                                const newPage: KnowledgeBasePage = {
                                    id: crypto.randomUUID(),
                                    title: "Untitled",
                                    blocks: [{ type: "paragraph", content: [] }],
                                    children: [],
                                };
                                setKnowledgeBase({ ...knowledgeBase, pages: [...knowledgeBase.pages, newPage] });
                                setSelectedPageId(newPage.id);
                                setSidebarExpanded(true);
                            }}
                        />
                    </div>
                )}
            </div>

            {/* ── Editor + Right Panel ── */}
            {selectedPage ? (
                <div className="flex flex-1 overflow-hidden">
                    <div className={`${rightPanel && !rightPanelExpanded ? "flex-1" : rightPanel && rightPanelExpanded ? "hidden" : "w-full"} overflow-hidden transition-all duration-300`}>
                        <PageEditor
                            key={selectedPage.id}
                            page={selectedPage}
                            allPages={knowledgeBase.pages}
                            setRightPanel={handleSetRightPanel}
                            onChange={(updatedPage) => {
                                setKnowledgeBase({ ...knowledgeBase, pages: updatePageById(knowledgeBase.pages, updatedPage.id, updatedPage) });
                            }}
                        />
                    </div>

                    {rightPanel && (
                        <div className={`${rightPanelExpanded ? "flex-1" : "w-[460px]"} shrink-0 border-l border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] overflow-hidden flex flex-col transition-all duration-300`}>
                            <div className="flex items-center justify-end px-2 py-1.5 border-b border-[var(--color-border-subtle)] bg-[var(--color-muted)] shrink-0">
                                <button
                                    onClick={() => setRightPanelExpanded((v) => !v)}
                                    className="p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--color-muted)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                                    title={rightPanelExpanded ? "Collapse" : "Expand"}
                                >
                                    {rightPanelExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                                </button>
                            </div>
                            {rightPanel}
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-xl)] bg-[var(--color-muted)]">
                        <FileText size={24} className="text-[var(--color-text-tertiary)]" />
                    </div>
                    <Text variant="h5" className="text-[var(--color-text-secondary)]">
                        No page selected
                    </Text>
                    <Text variant="bodySm">
                        Choose a page from the sidebar, or create a new one.
                    </Text>
                    <p ref={statusBarRef} />
                </div>
            )}
        </div>
    );
}

// ─── PageTree ─────────────────────────────────────────────────────────────────

function PageTree({ pages, selectedPageId, setSelectedPageId, knowledgeBase, setKnowledgeBase, level }: {
    pages: KnowledgeBasePage[]; selectedPageId: string | null;
    setSelectedPageId: (id: string) => void;
    knowledgeBase: KnowledgeBase; setKnowledgeBase: (kb: KnowledgeBase) => void;
    level: number;
}) {
    return (
        <div className="space-y-0.5">
            {pages.map((page) => (
                <div key={page.id}>
                    <div
                        className={`group flex items-center rounded-[var(--radius-md)] px-2 py-1.5 cursor-pointer transition-colors duration-[var(--duration-fast)] ${selectedPageId === page.id ? "bg-[var(--color-accent-subtle)] text-[var(--color-primary)]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-muted)] hover:text-[var(--color-text-primary)]"}`}
                        style={{ paddingLeft: `${level * 12 + 8}px` }}
                        onClick={() => setSelectedPageId(page.id)}
                    >
                        <div className="flex-1 min-w-0">
                            <p className={`truncate text-sm font-medium ${selectedPageId === page.id ? "text-[var(--color-primary)]" : ""}`}>
                                {page.title || "Untitled"}
                            </p>
                            {page.tags && page.tags.length > 0 && (
                                <p className="text-xs text-[var(--color-text-tertiary)] truncate mt-0.5">
                                    {page.tags.length} tag{page.tags.length !== 1 ? "s" : ""}
                                </p>
                            )}
                        </div>
                        <button
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--color-danger-light)] text-[var(--color-text-tertiary)] hover:text-[var(--color-danger)] transition-all"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!confirm("Delete this page and all its children?")) return;
                                setKnowledgeBase({ ...knowledgeBase, pages: deletePageById(knowledgeBase.pages, page.id) });
                                if (selectedPageId === page.id) setSelectedPageId("__NOSELECTION__");
                            }}
                        >
                            <Trash2 size={13} />
                        </button>
                        <button
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--color-muted)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-all"
                            onClick={(e) => {
                                e.stopPropagation();
                                const child: KnowledgeBasePage = { id: crypto.randomUUID(), title: "Untitled", blocks: [{ type: "paragraph", content: [] }], children: [] };
                                setKnowledgeBase({ ...knowledgeBase, pages: addChildPage(knowledgeBase.pages, page.id, child) });
                                setSelectedPageId(child.id);
                            }}
                        >
                            <Plus size={13} />
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

// ─── PageEditor (shell only — BlockNote internals unchanged) ──────────────────

function PageEditor({ page, onChange, allPages, setRightPanel }: {
    page: KnowledgeBasePage; onChange: (page: KnowledgeBasePage) => void;
    allPages: KnowledgeBasePage[]; setRightPanel: (node: React.ReactNode | null) => void;
}) {
    const schema = useMemo(() => createCustomSchema(allPages, setRightPanel), [allPages, setRightPanel]);
    const editor = useCreateBlockNote({
        initialContent: (() => {
            const blocks = page.blocks && page.blocks.length > 0
                ? sanitizeBlocks(page.blocks as PartialBlock[])
                : [{ type: "paragraph" as const, content: [] }];
            return blocks;
        })(),
        schema,
    });

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;
        editor.onEditorContentChange(() => {
            clearTimeout(timeout);
            timeout = setTimeout(() => { onChange({ ...page, blocks: structuredClone(editor.document) as PartialBlock[] }); }, 500);
        });
        return () => { clearTimeout(timeout); };
    }, [editor, onChange, page]);

    const getSlashMenuItems = async (query: string) => {
        const defaultItems = getDefaultReactSlashMenuItems(editor);
        const customItems: DefaultReactSuggestionItem[] = [
            { title: "Database", subtext: "Insert a database table", onItemClick: () => { editor.insertBlocks([{ type: "database", props: { title: "New Database", columnsJson: "[]", entriesJson: "[]" } }], editor.getTextCursorPosition().block, "after"); }, group: "Custom", icon: <Database size={18} /> },
            { title: "Page Link", subtext: "Link to another page", onItemClick: () => { editor.insertBlocks([{ type: "pageLink", props: { pageId: "", pageTitle: "" } }], editor.getTextCursorPosition().block, "after"); }, group: "Custom", icon: <LinkIcon size={18} /> },
            { title: "Embed", subtext: "Embed a URL as an iframe", onItemClick: () => { editor.insertBlocks([{ type: "embed", props: { url: "", title: "" } }], editor.getTextCursorPosition().block, "after"); }, group: "Custom", icon: <Code size={18} /> },
        ];
        return [...defaultItems, ...customItems].filter((item) => !query || item.title.toLowerCase().includes(query.toLowerCase()));
    };

    return (
        <div className="flex h-full flex-col bg-[var(--color-surface-raised)]">
            {/* Page title + tags */}
            <div className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]">
                <div className="px-8 pt-8 pb-4">
                    <input
                        value={page.title}
                        onChange={(e) => onChange({ ...page, title: e.target.value })}
                        placeholder="Untitled page"
                        className="w-full bg-transparent font-[family-name:var(--font-display)] text-4xl font-normal text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)] outline-none tracking-tight leading-tight"
                    />
                    <div className="mt-2 h-0.5 w-12 bg-[var(--color-accent)] rounded-full" />
                </div>
                <TagInput
                    tags={page.tags || []}
                    onTagsChange={(tags) => onChange({ ...page, tags })}
                />
            </div>
            {/* Editor body */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto px-8 py-8">
                    <BlockNoteView editor={editor} theme="light" slashMenu={false}>
                        <SuggestionMenuController triggerCharacter="/" getItems={getSlashMenuItems} />
                    </BlockNoteView>
                </div>
            </div>
        </div>
    );
}

// ─── TagInput (unchanged logic, reskinned) ────────────────────────────────────

function TagInput({ tags, onTagsChange }: { tags: string[]; onTagsChange: (tags: string[]) => void }) {
    const [inputValue, setInputValue] = useState("");
    const [courses, setCourses] = useState<Record<string, any>>({});
    const [assignments, setAssignments] = useState<Record<string, any>>({});
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [loadingAssignments, setLoadingAssignments] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedType, setSelectedType] = useState<TagType>("generic");
    const [showPopup, setShowPopup] = useState(false);
    const popupRef = useRef<HTMLDivElement>(null);
    const { token } = useAuth();

    useEffect(() => {
        if (!token || selectedType !== "course") return;
        setLoadingCourses(true);
        fetch("/api/lms/courses", { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => r.json()).then((d) => { if (d.courses) setCourses(d.courses); })
            .catch(console.error).finally(() => setLoadingCourses(false));
    }, [token, selectedType]);

    useEffect(() => {
        if (!token || selectedType !== "assignment") return;
        setLoadingAssignments(true);
        fetch("/api/lms/assignments", { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => r.json()).then((d) => { if (d.assignments) setAssignments(d.assignments); })
            .catch(console.error).finally(() => setLoadingAssignments(false));
    }, [token, selectedType]);

    const handleAddTag = () => {
        if (!inputValue.trim()) return;
        let tagValue = inputValue.trim();
        if (selectedType === "number" && isNaN(Number(tagValue))) return;
        if (selectedType === "date") {
            const d = new Date(tagValue);
            if (isNaN(d.getTime())) return;
            tagValue = d.toISOString().split("T")[0];
        }
        const newTag = formatTag(selectedType, tagValue);
        if (!tags.includes(newTag)) onTagsChange([...tags, newTag]);
        setInputValue(""); setShowSuggestions(false); setShowPopup(false);
    };

    const getSuggestions = () => {
        if (!inputValue.trim()) return [];
        const q = inputValue.toLowerCase();
        if (selectedType === "course") return Object.entries(courses).filter(([, c]: any) => c.name.toLowerCase().includes(q)).slice(0, 5).map(([id, c]: any) => ({ id, name: c.name }));
        if (selectedType === "assignment") return Object.entries(assignments).filter(([, a]: any) => a.title.toLowerCase().includes(q)).slice(0, 5).map(([id, a]: any) => ({ id, name: a.title }));
        return [];
    };

    const suggestions = getSuggestions();
    const parsedTags = tags.map(parseTag).filter(Boolean) as ParsedTag[];

    return (
        <div className="border-b border-[var(--color-border-subtle)] px-6 py-3">
            <div className="flex items-center gap-2 flex-wrap">
                {parsedTags.length === 0 && (
                    <span className="text-xs text-[var(--color-text-tertiary)] italic">No tags</span>
                )}
                {parsedTags.map((tag, i) => (
                    <div key={i} className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${getTagColor(tag.type)}`}>
                        <span>{getTagIcon(tag.type)}</span>
                        <span className="max-w-xs truncate">
                            {tag.type === "course" && courses[tag.value] ? courses[tag.value].name
                                : tag.type === "assignment" && assignments[tag.value] ? assignments[tag.value].title
                                    : tag.display}
                        </span>
                        <button onClick={() => onTagsChange(tags.filter((_, j) => j !== i))} className="hover:opacity-70 ml-0.5">
                            <X size={12} />
                        </button>
                    </div>
                ))}
                <button
                    onClick={() => setShowPopup(!showPopup)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--color-muted)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] border border-[var(--color-border)] transition-colors"
                >
                    <Plus size={12} /> Add tag
                </button>
            </div>

            {showPopup && (
                <div ref={popupRef} onMouseLeave={() => setShowPopup(false)}
                    className="fixed z-50 bg-[var(--color-surface-overlay)] rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] border border-[var(--color-border)] p-4 w-72"
                    style={{ top: "150px", left: "50%", transform: "translateX(-50%)" }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                            <TagIcon size={15} className="text-[var(--color-primary)]" /> Create tag
                        </span>
                        <button onClick={() => setShowPopup(false)} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]">
                            <X size={16} />
                        </button>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <p className="text-[11px] font-medium tracking-[0.1em] uppercase text-[var(--color-text-tertiary)] mb-1.5">Type</p>
                            <select value={selectedType} onChange={(e) => { setSelectedType(e.target.value as TagType); setInputValue(""); setShowSuggestions(false); }}
                                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
                            >
                                <option value="generic">🏷️ Generic</option>
                                <option value="course">📚 Course</option>
                                <option value="assignment">✓ Assignment</option>
                                <option value="date">📅 Date</option>
                                <option value="class">🎓 Class</option>
                                <option value="number"># Number</option>
                            </select>
                        </div>
                        <div>
                            <p className="text-[11px] font-medium tracking-[0.1em] uppercase text-[var(--color-text-tertiary)] mb-1.5">Value</p>
                            {selectedType === "date" ? (
                                <input type="date" value={inputValue} onChange={(e) => setInputValue(e.target.value)} className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]" />
                            ) : selectedType === "number" ? (
                                <input type="number" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Enter a number" className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]" />
                            ) : (
                                <div className="relative">
                                    <input type="text" value={inputValue} onChange={(e) => { setInputValue(e.target.value); setShowSuggestions(true); }} onKeyDown={(e) => e.key === "Enter" && handleAddTag()} placeholder={selectedType === "course" ? "Search courses…" : selectedType === "assignment" ? "Search assignments…" : "Enter value…"} className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]" autoFocus />
                                    {showSuggestions && suggestions.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-lg)] z-10 max-h-48 overflow-y-auto">
                                            {suggestions.map((s) => (
                                                <button key={s.id} onClick={() => { setInputValue(s.id); setShowSuggestions(false); handleAddTag(); }} className="w-full px-3 py-2 text-left text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-muted)] border-b border-[var(--color-border-subtle)] last:border-b-0">
                                                    {s.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {(loadingCourses || loadingAssignments) && (
                                        <div className="absolute top-full left-0 right-0 mt-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-overlay)] p-3 text-center text-xs text-[var(--color-text-tertiary)]">
                                            Loading…
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2 pt-1">
                            <button onClick={() => setShowPopup(false)} className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-muted)] transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleAddTag} disabled={!inputValue.trim()} className="flex-1 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-3 py-2 text-sm font-medium text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-40 transition-colors">
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

type SortConfig = { key: string; direction: "asc" | "desc" } | null;

function DatabaseBlock({
    data,
    title,
    columns,
    onChange,
    allPages,
    setRightPanel,
}: {
    data?: DatabaseBlockData;
    title?: string;
    columns?: { key: string; type: TagType }[];
    onChange: (
        title: string,
        columns: { key: string; type: TagType }[],
        entries: DatabaseEntry[],
    ) => void;
    allPages: KnowledgeBasePage[];
    setRightPanel: (node: React.ReactNode | null) => void;
}) {
    const [dbTitle, setDbTitle] = useState(title || "New Database");
    const [dbColumns, setDbColumns] = useState<{ key: string; type: TagType }[]>(columns || []);
    const [dbEntries, setDbEntries] = useState<DatabaseEntry[]>(data?.entries || []);
    const [editingCell, setEditingCell] = useState<{ entryId: string; key: string } | null>(null);
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [sort, setSort] = useState<SortConfig>(null);
    const [showAddColumn, setShowAddColumn] = useState(false);
    const [newColName, setNewColName] = useState("");
    const [newColType, setNewColType] = useState<TagType>("generic");
    const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [openEntryId, setOpenEntryId] = useState<string | null>(null);

    // Keep a ref to latest entries so the panel's onSave closure is always fresh
    const dbEntriesRef = useRef(dbEntries);
    useEffect(() => {
        dbEntriesRef.current = dbEntries;
    }, [dbEntries]);

    const saveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (saveRef.current) clearTimeout(saveRef.current);
        saveRef.current = setTimeout(() => {
            onChange(dbTitle, dbColumns, dbEntries);
        }, 300);
        return () => {
            if (saveRef.current) clearTimeout(saveRef.current);
        };
    }, [dbTitle, dbColumns, dbEntries]);

    // Stable callback for the entry editor to save blocks back
    const handleEntrySave = useRef((entryId: string, blocks: PartialBlock[]) => {
        setDbEntries((prev) =>
            prev.map((e) => (e.id === entryId ? { ...e, pageContent: blocks } : e)),
        );
    }).current;

    const openEntryPanel = (entry: DatabaseEntry) => {
        setOpenEntryId(entry.id);
        setRightPanel(
            <EntryPageEditor
                key={entry.id}
                entry={entry}
                onClose={() => {
                    setOpenEntryId(null);
                    setRightPanel(null);
                }}
                onSave={handleEntrySave}
                allPages={allPages}
            />,
        );
    };

    const addColumn = () => {
        if (!newColName.trim()) return;
        const col = { key: newColName.trim(), type: newColType };
        setDbColumns((prev) => [...prev, col]);
        setDbEntries((prev) =>
            prev.map((entry) => ({
                ...entry,
                values: { ...entry.values, [col.key]: { type: col.type, value: "" } },
            })),
        );
        setNewColName("");
        setNewColType("generic");
        setShowAddColumn(false);
    };

    const deleteColumn = (key: string) => {
        setDbColumns((prev) => prev.filter((c) => c.key !== key));
        setDbEntries((prev) =>
            prev.map((entry) => {
                const values = { ...entry.values };
                delete values[key];
                return { ...entry, values };
            }),
        );
    };

    const addEntry = () => {
        const newEntry: DatabaseEntry = {
            id: crypto.randomUUID(),
            name: "Untitled",
            pageContent: [{ type: "paragraph", content: [] }] as PartialBlock[],
            values: Object.fromEntries(
                dbColumns.map((col) => [col.key, { type: col.type, value: "" }]),
            ),
        };
        setDbEntries((prev) => [...prev, newEntry]);
    };

    const updateEntry = (entryId: string, key: string, value: string) => {
        setDbEntries((prev) =>
            prev.map((entry) =>
                entry.id === entryId
                    ? {
                        ...entry,
                        values: { ...entry.values, [key]: { ...entry.values[key], value } },
                    }
                    : entry,
            ),
        );
    };

    const updateEntryName = (entryId: string, name: string) => {
        setDbEntries((prev) => prev.map((e) => (e.id === entryId ? { ...e, name } : e)));
    };

    const deleteEntry = (entryId: string) => {
        setDbEntries((prev) => prev.filter((entry) => entry.id !== entryId));
        if (selectedEntryId === entryId) setSelectedEntryId(null);
        if (openEntryId === entryId) {
            setOpenEntryId(null);
            setRightPanel(null);
        }
    };

    const toggleSort = (key: string) => {
        setSort((prev: any) => {
            if (prev?.key === key)
                return prev.direction === "asc" ? { key, direction: "desc" } : null;
            return { key, direction: "asc" };
        });
    };

    const processedEntries = useMemo(() => {
        let result = [...dbEntries];
        Object.entries(filters).forEach(([key, filterVal]) => {
            if (!filterVal) return;
            result = result.filter((entry) =>
                (entry.values[key]?.value || "").toLowerCase().includes(filterVal.toLowerCase()),
            );
        });
        if (sort) {
            result.sort((a, b) => {
                const aVal = a.values[sort.key]?.value || "";
                const bVal = b.values[sort.key]?.value || "";
                const col = dbColumns.find((c) => c.key === sort.key);
                let cmp = 0;
                if (col?.type === "number") cmp = (parseFloat(aVal) || 0) - (parseFloat(bVal) || 0);
                else if (col?.type === "date")
                    cmp = new Date(aVal).getTime() - new Date(bVal).getTime();
                else cmp = aVal.localeCompare(bVal);
                return sort.direction === "asc" ? cmp : -cmp;
            });
        }
        return result;
    }, [dbEntries, filters, sort, dbColumns]);

    return (
        <div
            className="my-4 rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden text-zinc-900 selection:text-inherit"
            contentEditable={false}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 bg-zinc-50">
                <div className="flex items-center gap-2">
                    <Database size={16} className="text-zinc-500" />
                    <input
                        type="text"
                        value={dbTitle}
                        onChange={(e) => setDbTitle(e.target.value)}
                        className="text-sm font-semibold text-zinc-900 bg-transparent outline-none border-b border-transparent hover:border-zinc-300 focus:border-blue-500 transition-colors px-1"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-xs text-zinc-400">{dbEntries.length} entries</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${showFilters ? "bg-blue-100 text-blue-700" : "text-zinc-600 hover:bg-zinc-200"}`}
                    >
                        <Filter size={12} /> Filter
                    </button>
                    <button
                        onClick={() => setShowAddColumn(true)}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-zinc-600 hover:bg-zinc-200 transition-colors"
                    >
                        <Plus size={12} /> Column
                    </button>
                    <button
                        onClick={addEntry}
                        className="flex items-center gap-1 px-3 py-1 rounded bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={12} /> New
                    </button>
                </div>
            </div>

            {/* Filter row */}
            {showFilters && dbColumns.length > 0 && (
                <div className="flex gap-2 px-4 py-2 border-b border-zinc-200 bg-zinc-50 flex-wrap">
                    {dbColumns.map((col) => (
                        <div key={col.key} className="flex items-center gap-1">
                            <span className="text-xs text-zinc-500">{col.key}:</span>
                            <input
                                type="text"
                                placeholder="Filter..."
                                value={filters[col.key] || ""}
                                onChange={(e) =>
                                    setFilters({ ...filters, [col.key]: e.target.value })
                                }
                                className="text-xs border border-zinc-300 rounded px-2 py-0.5 outline-none focus:ring-1 focus:ring-blue-500 w-24"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="border-b border-zinc-200 bg-zinc-50">
                            <th className="px-3 py-2 text-left font-medium text-zinc-600 border-r border-zinc-100 whitespace-nowrap w-48">
                                <div className="flex items-center gap-1 text-xs">
                                    <FileText size={12} /> Name
                                </div>
                            </th>
                            {dbColumns.map((col) => (
                                <th
                                    key={col.key}
                                    className="px-3 py-2 text-left font-medium text-zinc-600 border-r border-zinc-100 last:border-r-0 whitespace-nowrap"
                                >
                                    <div className="flex items-center gap-1 group">
                                        <span className="text-xs">
                                            {getTagIcon(col.type as TagType)}
                                        </span>
                                        <button
                                            onClick={() => toggleSort(col.key)}
                                            className="flex items-center gap-1 hover:text-zinc-900 transition-colors"
                                        >
                                            {col.key}
                                            {sort?.key === col.key ? (
                                                sort.direction === "asc" ? (
                                                    <ChevronUp size={12} />
                                                ) : (
                                                    <ChevronDown size={12} />
                                                )
                                            ) : (
                                                <ChevronsUpDown
                                                    size={12}
                                                    className="opacity-0 group-hover:opacity-50"
                                                />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => deleteColumn(col.key)}
                                            className="opacity-0 group-hover:opacity-100 ml-1 text-red-400 hover:text-red-600 transition-all"
                                        >
                                            <X size={11} />
                                        </button>
                                    </div>
                                </th>
                            ))}
                            <th className="px-3 py-2 w-8" />
                        </tr>
                    </thead>
                    <tbody>
                        {processedEntries.map((entry) => (
                            <tr
                                key={entry.id}
                                className={`border-b border-zinc-100 hover:bg-zinc-50 transition-colors ${openEntryId === entry.id ? "bg-blue-50" : ""}`}
                            >
                                <td
                                    className="px-3 py-2 border-r border-zinc-100 w-48"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="flex items-center gap-1.5 group/name">
                                        <button
                                            onClick={() => openEntryPanel(entry)}
                                            className="flex items-center gap-1.5 min-w-0 hover:text-blue-600 transition-colors"
                                        >
                                            <div
                                                className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${openEntryId === entry.id ? "bg-blue-100" : "bg-zinc-100 group-hover/name:bg-blue-100"}`}
                                            >
                                                <FileText
                                                    size={11}
                                                    className={`transition-colors ${openEntryId === entry.id ? "text-blue-500" : "text-zinc-500 group-hover/name:text-blue-500"}`}
                                                />
                                            </div>
                                            <input
                                                className="text-sm font-medium text-zinc-800 bg-transparent outline-none border-b border-transparent hover:border-zinc-300 focus:border-blue-500 truncate max-w-32"
                                                value={entry.name || "Untitled"}
                                                onChange={(e) =>
                                                    updateEntryName(entry.id, e.target.value)
                                                }
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openEntryPanel(entry);
                                            }}
                                            className="opacity-0 group-hover/name:opacity-100 ml-auto text-zinc-400 hover:text-blue-500 transition-all"
                                            title="Open page"
                                        >
                                            <ExternalLink size={11} />
                                        </button>
                                    </div>
                                </td>
                                {dbColumns.map((col) => {
                                    const cell = entry.values[col.key];
                                    const isEditing =
                                        editingCell?.entryId === entry.id &&
                                        editingCell?.key === col.key;
                                    return (
                                        <td
                                            key={col.key}
                                            className="px-3 py-2 border-r border-zinc-100 last:border-r-0 max-w-xs"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingCell({ entryId: entry.id, key: col.key });
                                            }}
                                        >
                                            {isEditing ? (
                                                <input
                                                    type={
                                                        col.type === "number"
                                                            ? "number"
                                                            : col.type === "date"
                                                                ? "date"
                                                                : "text"
                                                    }
                                                    value={cell?.value || ""}
                                                    onChange={(e) =>
                                                        updateEntry(
                                                            entry.id,
                                                            col.key,
                                                            e.target.value,
                                                        )
                                                    }
                                                    autoFocus
                                                    className="w-full rounded border border-blue-400 px-2 py-0.5 text-sm outline-none focus:ring-1 focus:ring-blue-500 text-zinc-900"
                                                    onBlur={() => setEditingCell(null)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            ) : (
                                                <span
                                                    className={`text-sm font-medium ${cell?.value ? "text-zinc-800" : "text-zinc-400 italic"}`}
                                                >
                                                    {cell?.value || "Empty"}
                                                </span>
                                            )}
                                        </td>
                                    );
                                })}
                                <td className="px-2 py-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteEntry(entry.id);
                                        }}
                                        className="text-zinc-300 hover:text-red-500 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {processedEntries.length === 0 && (
                            <tr>
                                <td
                                    colSpan={dbColumns.length + 2}
                                    className="px-4 py-8 text-center text-sm text-zinc-400"
                                >
                                    No entries
                                    {Object.values(filters).some(Boolean)
                                        ? " match your filters"
                                        : " yet"}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Column Modal */}
            {showAddColumn && (
                <div className="border-t border-zinc-200 p-4 bg-zinc-50">
                    <p className="text-xs font-semibold text-zinc-700 mb-3 uppercase tracking-wide">
                        New Column
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Column name"
                            value={newColName}
                            onChange={(e) => setNewColName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addColumn()}
                            className="flex-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                        />
                        <select
                            value={newColType}
                            onChange={(e) => setNewColType(e.target.value as TagType)}
                            className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <option value="generic">🏷️ Text</option>
                            <option value="number"># Number</option>
                            <option value="date">📅 Date</option>
                            <option value="course">📚 Course</option>
                            <option value="assignment">✓ Assignment</option>
                            <option value="class">🎓 Class</option>
                        </select>
                        <button
                            onClick={addColumn}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                        >
                            Add
                        </button>
                        <button
                            onClick={() => setShowAddColumn(false)}
                            className="px-3 py-1.5 rounded-lg border border-zinc-300 text-sm text-zinc-600 hover:bg-zinc-100"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Page Link Block ──────────────────────────────────────────────────────────

function PageLinkBlock({
    data,
    onChange,
    allPages,
}: {
    data: PageLinkBlockData;
    onChange: (data: PageLinkBlockData) => void;
    allPages: KnowledgeBasePage[];
}) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const allPagesList = flattenPages(allPages);
    const filteredPages = allPagesList.filter((p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    const selectedPageTitle =
        allPagesList.find((p) => p.id === data.pageId)?.title || "Select a page...";

    return (
        <div
            className="my-2 inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-zinc-900"
            contentEditable={false}
        >
            <LinkIcon size={16} className="text-blue-600" />
            <div className="relative flex-1">
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 rounded px-2 py-1 hover:bg-blue-100 transition-colors"
                >
                    <span className="text-blue-900 font-medium truncate max-w-xs">
                        {selectedPageTitle}
                    </span>
                    {data.pageId && <ExternalLink size={14} className="text-blue-600" />}
                </button>
                {showDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-lg border border-zinc-300 bg-white shadow-lg">
                        <input
                            type="text"
                            placeholder="Search pages..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full border-b border-zinc-200 px-3 py-2 text-sm outline-none"
                            autoFocus
                        />
                        <div className="max-h-48 overflow-y-auto">
                            {filteredPages.map((page) => (
                                <button
                                    key={page.id}
                                    onClick={() => {
                                        onChange({
                                            ...data,
                                            pageId: page.id,
                                            pageTitle: page.title,
                                        });
                                        setShowDropdown(false);
                                        setSearchQuery("");
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-blue-50 border-b border-zinc-100 last:border-b-0"
                                >
                                    <div className="flex items-center gap-2">
                                        {page.depth > 0 && (
                                            <span className="text-zinc-400">
                                                {"\u00A0".repeat(page.depth * 2)}
                                            </span>
                                        )}
                                        <span className="font-medium">{page.title}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Embed Block ──────────────────────────────────────────────────────────────

function EmbedBlock({
    data,
    onChange,
}: {
    data: EmbedBlockData;
    onChange: (data: EmbedBlockData) => void;
}) {
    const [isEditing, setIsEditing] = useState(!data.url);
    const [tempUrl, setTempUrl] = useState(data.url);
    const handleSave = () => {
        if (tempUrl.trim()) {
            onChange({ ...data, url: tempUrl.trim() });
            setIsEditing(false);
        }
    };

    return (
        <div
            className="my-4 rounded-lg border border-zinc-200 p-4 bg-white text-zinc-900"
            contentEditable={false}
        >
            <div className="mb-2 flex items-center gap-2">
                <Code size={18} className="text-zinc-600" />
                {!isEditing && data.url && (
                    <span className="text-xs text-zinc-500 truncate flex-1">{data.url}</span>
                )}
                <button
                    onClick={() => {
                        setIsEditing(!isEditing);
                        setTempUrl(data.url);
                    }}
                    className="ml-auto text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                    {isEditing ? "Cancel" : "Edit URL"}
                </button>
            </div>
            {isEditing ? (
                <div className="space-y-2">
                    <input
                        type="url"
                        value={tempUrl}
                        onChange={(e) => setTempUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full rounded border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                    />
                    <button
                        onClick={handleSave}
                        disabled={!tempUrl.trim()}
                        className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        Embed
                    </button>
                </div>
            ) : data.url ? (
                <div
                    className="relative bg-zinc-100 rounded overflow-hidden"
                    style={{ paddingBottom: "56.25%" }}
                >
                    <iframe
                        src={data.url}
                        className="absolute top-0 left-0 w-full h-full border-none rounded"
                        allowFullScreen
                    />
                </div>
            ) : (
                <p className="text-sm text-zinc-500 italic">No URL provided</p>
            )}
        </div>
    );
}

// ─── Tree utilities ───────────────────────────────────────────────────────────

function findPageById(pages: KnowledgeBasePage[], id: string | null): KnowledgeBasePage | null {
    for (const page of pages) {
        if (page.id === id) return page;
        const child = findPageById(page.children, id);
        if (child) return child;
    }
    return null;
}
function updatePageById(pages: KnowledgeBasePage[], id: string, updatedPage: KnowledgeBasePage): KnowledgeBasePage[] {
    return pages.map((page) => page.id === id ? updatedPage : { ...page, children: updatePageById(page.children, id, updatedPage) });
}
function deletePageById(pages: KnowledgeBasePage[], id: string): KnowledgeBasePage[] {
    return pages.filter((page) => page.id !== id).map((page) => ({ ...page, children: deletePageById(page.children, id) }));
}
function addChildPage(pages: KnowledgeBasePage[], parentId: string, child: KnowledgeBasePage): KnowledgeBasePage[] {
    return pages.map((page) => page.id === parentId ? { ...page, children: [...page.children, child] } : { ...page, children: addChildPage(page.children, parentId, child) });
}