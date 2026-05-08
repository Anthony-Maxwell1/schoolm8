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
} from "lucide-react";
import { useAuth } from "@/context/authContext";
import { useRef } from "react";
import { Filter, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

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

export type PageLinkBlockData = {
    pageId: string;
    pageTitle?: string;
};

export type EmbedBlockData = {
    url: string;
    title?: string;
};

export type KnowledgeBasePage = {
    id: string;
    title: string;
    blocks: PartialBlock[];
    children: KnowledgeBasePage[];
    tags?: string[];
};

export type TagType = "course" | "assignment" | "date" | "class" | "generic" | "number";

export type ParsedTag = {
    type: TagType;
    value: string;
    display: string;
};

export const parseTag = (tag: string): ParsedTag | null => {
    const match = tag.match(/^([^:]+):(.+)$/);
    if (!match) return null;
    const [, type, value] = match;
    const normalizedType = type.toLowerCase();
    if (!["course", "assignment", "date", "class", "generic", "number"].includes(normalizedType))
        return null;
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
        course: "📚",
        assignment: "✓",
        date: "📅",
        class: "🎓",
        generic: "🏷️",
        number: "#",
    };
    return icons[type];
};

// ─── Entry Page Editor ───────────────────────────────────────────────────────
// A self-contained BlockNote editor for a database entry's page content.
function EntryPageEditor({
    entry,
    onClose,
    onSave,
    allPages,
}: {
    entry: DatabaseEntry;
    onClose: () => void;
    onSave: (entryId: string, blocks: PartialBlock[]) => void;
    allPages: KnowledgeBasePage[];
}) {
    const schema = useMemo(() => createCustomSchema(allPages), [allPages]);
    const initialContent = useMemo(
        () =>
            entry.pageContent && entry.pageContent.length > 0
                ? entry.pageContent
                : [{ type: "paragraph" as const, content: [] }],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [entry.id],
    );

    const editor = useCreateBlockNote({ initialContent, schema });

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;

        editor.onEditorContentChange(() => {
            clearTimeout(timeout);

            timeout = setTimeout(() => {
                onSave(entry.id, editor.document as PartialBlock[]);
            }, 500);
        });

        return () => {
            clearTimeout(timeout);
        };
    }, [editor, entry.id, onSave]);

    return (
        <div className="flex flex-col h-full">
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-200 bg-zinc-50 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded bg-zinc-200 flex items-center justify-center shrink-0">
                        <FileText size={13} className="text-zinc-600" />
                    </div>
                    <span className="text-sm font-semibold text-zinc-900 truncate">
                        {entry.name || "Untitled"}
                    </span>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded hover:bg-zinc-200 text-zinc-500 hover:text-zinc-700 transition-colors shrink-0"
                >
                    <X size={15} />
                </button>
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-y-auto">
                <div className="px-5 py-5">
                    <div className="entry-editor">
                        <BlockNoteView editor={editor} theme="light" />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Custom Block Specs ───────────────────────────────────────────────────────

const createDatabaseBlockSpec = (
    allPages: KnowledgeBasePage[],
    setRightPanel: (node: React.ReactNode | null) => void,
) =>
    createReactBlockSpec(
        {
            type: "database",
            propSchema: {
                title: { default: "New Database" },
                columnsJson: { default: "[]" },
                entriesJson: { default: "[]" },
            },
            content: "none",
        },
        {
            render: (props) => {
                const columns = JSON.parse(props.block.props.columnsJson || "[]");
                const entries = JSON.parse(props.block.props.entriesJson || "[]");
                return (
                    <DatabaseBlock
                        data={{ title: props.block.props.title, columns, entries }}
                        title={props.block.props.title}
                        columns={columns}
                        onChange={(title, columns, entries) => {
                            props.editor.updateBlock(props.block, {
                                type: "database",
                                props: {
                                    title,
                                    columnsJson: JSON.stringify(columns),
                                    entriesJson: JSON.stringify(entries),
                                },
                            });
                        }}
                        allPages={allPages}
                        setRightPanel={setRightPanel}
                    />
                );
            },
        },
    );

const createPageLinkBlockSpec = (allPages: KnowledgeBasePage[]) =>
    createReactBlockSpec(
        {
            type: "pageLink",
            propSchema: { pageId: { default: "" }, pageTitle: { default: "" } },
            content: "none",
        },
        {
            render: (props) => (
                <PageLinkBlock
                    data={{
                        pageId: props.block.props.pageId,
                        pageTitle: props.block.props.pageTitle,
                    }}
                    onChange={(data) => {
                        props.editor.updateBlock(props.block, {
                            type: "pageLink",
                            props: { pageId: data.pageId, pageTitle: data.pageTitle },
                        });
                    }}
                    allPages={allPages}
                />
            ),
        },
    );

const createEmbedBlockSpec = () =>
    createReactBlockSpec(
        {
            type: "embed",
            propSchema: { url: { default: "" }, title: { default: "" } },
            content: "none",
        },
        {
            render: (props) => (
                <EmbedBlock
                    data={{ url: props.block.props.url, title: props.block.props.title }}
                    onChange={(data) => {
                        props.editor.updateBlock(props.block, {
                            type: "embed",
                            props: { url: data.url, title: data.title },
                        });
                    }}
                />
            ),
        },
    );

const createCustomSchema = (
    allPages: KnowledgeBasePage[],
    setRightPanel?: (node: React.ReactNode | null) => void,
) => {
    const noop = () => {};
    return BlockNoteSchema.create({
        blockSpecs: {
            ...defaultBlockSpecs,
            database: createDatabaseBlockSpec(allPages, setRightPanel ?? noop)(),
            pageLink: createPageLinkBlockSpec(allPages)(),
            embed: createEmbedBlockSpec()(),
        },
    });
};

// ─── Database Block ───────────────────────────────────────────────────────────

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
        setSort((prev) => {
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
                                            <span
                                                className={`text-sm font-medium truncate max-w-32 transition-colors ${openEntryId === entry.id ? "text-blue-600" : "text-zinc-800 group-hover/name:text-blue-600"}`}
                                            >
                                                {entry.name || "Untitled"}
                                            </span>
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function flattenPages(
    pages: KnowledgeBasePage[],
    depth = 0,
): (KnowledgeBasePage & { depth: number })[] {
    return pages.flatMap((page) => [{ ...page, depth }, ...flattenPages(page.children, depth + 1)]);
}

export type KnowledgeBase = { pages: KnowledgeBasePage[] };
type Props = { knowledgeBase: KnowledgeBase; setKnowledgeBase: (kb: KnowledgeBase) => void };

// ─── Root Component ───────────────────────────────────────────────────────────

export default function KnowledgeBaseEditor({ knowledgeBase, setKnowledgeBase }: Props) {
    const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
    const [sidebarExpanded, setSidebarExpanded] = useState(true);
    const [rightPanel, setRightPanel] = useState<React.ReactNode | null>(null);

    useEffect(() => {
        if (!selectedPageId && knowledgeBase.pages.length > 0)
            setSelectedPageId(knowledgeBase.pages[0].id);
    }, [knowledgeBase.pages, selectedPageId]);

    const selectedPage = useMemo(
        () => findPageById(knowledgeBase.pages, selectedPageId),
        [knowledgeBase.pages, selectedPageId],
    );

    if (!selectedPage)
        return (
            <div className="flex h-screen items-center justify-center text-zinc-500">
                No page selected
            </div>
        );

    return (
        <div className="flex h-screen overflow-hidden bg-white">
            {/* Sidebar */}
            <div
                className={`${sidebarExpanded ? "w-72" : "w-16"} border-r border-zinc-200 overflow-y-auto bg-gradient-to-b from-white to-zinc-50 flex flex-col transition-all duration-300 shrink-0`}
            >
                <div className="sticky top-0 bg-white border-b border-zinc-200 px-5 py-6 z-10">
                    <div className="flex items-center justify-between">
                        <div
                            className={`flex items-center gap-2 ${!sidebarExpanded && "justify-center w-full"}`}
                        >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0">
                                <TagIcon className="text-white" size={18} />
                            </div>
                            {sidebarExpanded && (
                                <h1 className="text-lg font-bold text-zinc-900 whitespace-nowrap">
                                    Knowledge Base
                                </h1>
                            )}
                        </div>
                        <button
                            onClick={() => setSidebarExpanded(!sidebarExpanded)}
                            className={`p-1 hover:bg-zinc-100 rounded transition-colors ${sidebarExpanded && "ml-2"}`}
                        >
                            <ChevronUp
                                size={18}
                                className={`text-zinc-600 transition-transform ${sidebarExpanded ? "" : "rotate-90"}`}
                            />
                        </button>
                    </div>
                </div>
                {sidebarExpanded && (
                    <div className="flex-1 overflow-y-auto px-3 py-4">
                        <div className="mb-3 px-2">
                            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                                Pages
                            </h2>
                        </div>
                        <PageTree
                            pages={knowledgeBase.pages}
                            selectedPageId={selectedPageId}
                            setSelectedPageId={(id) => {
                                setSelectedPageId(id);
                                setRightPanel(null);
                            }}
                            knowledgeBase={knowledgeBase}
                            setKnowledgeBase={setKnowledgeBase}
                            level={0}
                        />
                    </div>
                )}
                {sidebarExpanded && (
                    <div className="border-t border-zinc-200 p-4 bg-white sticky bottom-0">
                        <button
                            className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
                            onClick={() => {
                                const newPage: KnowledgeBasePage = {
                                    id: crypto.randomUUID(),
                                    title: "Untitled",
                                    blocks: [{ type: "paragraph", content: [] }],
                                    children: [],
                                };
                                setKnowledgeBase({
                                    ...knowledgeBase,
                                    pages: [...knowledgeBase.pages, newPage],
                                });
                                setSelectedPageId(newPage.id);
                                setRightPanel(null);
                            }}
                        >
                            <Plus size={18} />
                            <span>New Page</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Editor + Right Panel */}
            <div className="flex flex-1 overflow-hidden">
                <div
                    className={`${rightPanel ? "flex-1" : "w-full"} overflow-hidden transition-all duration-300`}
                >
                    <PageEditor
                        key={selectedPage.id}
                        page={selectedPage}
                        allPages={knowledgeBase.pages}
                        setRightPanel={setRightPanel}
                        onChange={(updatedPage) => {
                            setKnowledgeBase({
                                ...knowledgeBase,
                                pages: updatePageById(
                                    knowledgeBase.pages,
                                    updatedPage.id,
                                    updatedPage,
                                ),
                            });
                        }}
                    />
                </div>

                {/* Right panel slot */}
                {rightPanel && (
                    <div className="w-[460px] shrink-0 border-l border-zinc-200 bg-white overflow-hidden flex flex-col">
                        {rightPanel}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Tag Input ────────────────────────────────────────────────────────────────

function TagInput({
    tags,
    onTagsChange,
}: {
    tags: string[];
    onTagsChange: (tags: string[]) => void;
}) {
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
            .then((r) => r.json())
            .then((d) => {
                if (d.courses) setCourses(d.courses);
            })
            .catch(console.error)
            .finally(() => setLoadingCourses(false));
    }, [token, selectedType]);

    useEffect(() => {
        if (!token || selectedType !== "assignment") return;
        setLoadingAssignments(true);
        fetch("/api/lms/assignments", { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => r.json())
            .then((d) => {
                if (d.assignments) setAssignments(d.assignments);
            })
            .catch(console.error)
            .finally(() => setLoadingAssignments(false));
    }, [token, selectedType]);

    const handleAddTag = () => {
        if (!inputValue.trim()) return;
        let tagValue = inputValue.trim();
        if (selectedType === "number" && isNaN(Number(tagValue))) {
            alert("Please enter a valid number");
            return;
        }
        if (selectedType === "date") {
            const d = new Date(tagValue);
            if (isNaN(d.getTime())) {
                alert("Please enter a valid date");
                return;
            }
            tagValue = d.toISOString().split("T")[0];
        }
        const newTag = formatTag(selectedType, tagValue);
        if (!tags.includes(newTag)) onTagsChange([...tags, newTag]);
        setInputValue("");
        setShowSuggestions(false);
        setShowPopup(false);
    };

    const getSuggestions = () => {
        if (!inputValue.trim()) return [];
        const q = inputValue.toLowerCase();
        if (selectedType === "course")
            return Object.entries(courses)
                .filter(([, c]: any) => c.name.toLowerCase().includes(q))
                .slice(0, 5)
                .map(([id, c]: any) => ({ id, name: c.name }));
        if (selectedType === "assignment")
            return Object.entries(assignments)
                .filter(([, a]: any) => a.title.toLowerCase().includes(q))
                .slice(0, 5)
                .map(([id, a]: any) => ({ id, name: a.title }));
        return [];
    };

    const suggestions = getSuggestions();
    const parsedTags = tags.map(parseTag).filter(Boolean) as ParsedTag[];

    return (
        <div className="border-b border-zinc-200 px-6 py-4">
            <div className="flex items-center gap-2 flex-wrap mb-3">
                {parsedTags.length === 0 ? (
                    <span className="text-sm text-zinc-400 italic">No tags yet</span>
                ) : (
                    parsedTags.map((tag, i) => (
                        <div
                            key={i}
                            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border ${getTagColor(tag.type)}`}
                        >
                            <span className="text-sm">{getTagIcon(tag.type)}</span>
                            <span className="max-w-xs truncate">
                                {tag.type === "course" && courses[tag.value]
                                    ? courses[tag.value].name
                                    : tag.type === "assignment" && assignments[tag.value]
                                      ? assignments[tag.value].title
                                      : tag.display}
                            </span>
                            <button
                                onClick={() => onTagsChange(tags.filter((_, j) => j !== i))}
                                className="hover:opacity-70 ml-0.5"
                            >
                                <X size={13} />
                            </button>
                        </div>
                    ))
                )}
                <button
                    onClick={() => setShowPopup(!showPopup)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border border-zinc-300"
                >
                    <Plus size={13} />
                    <span>Add tag</span>
                </button>
            </div>

            {showPopup && (
                <div
                    ref={popupRef}
                    onMouseLeave={() => setShowPopup(false)}
                    className="fixed z-50 bg-white rounded-xl shadow-xl border border-zinc-200 p-4 w-80"
                    style={{ top: "150px", left: "50%", transform: "translateX(-50%)" }}
                >
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <TagIcon size={18} className="text-zinc-700" />
                                <h3 className="font-semibold text-zinc-900">Create Tag</h3>
                            </div>
                            <button
                                onClick={() => setShowPopup(false)}
                                className="text-zinc-400 hover:text-zinc-600"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wide">
                                Tag Type
                            </label>
                            <select
                                value={selectedType}
                                onChange={(e) => {
                                    setSelectedType(e.target.value as TagType);
                                    setInputValue("");
                                    setShowSuggestions(false);
                                }}
                                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="generic">🏷️ Generic</option>
                                <option value="course">📚 Course</option>
                                <option value="assignment">✓ Assignment</option>
                                <option value="date">📅 Date</option>
                                <option value="class">🎓 Class</option>
                                <option value="number"># Number</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wide">
                                Value
                            </label>
                            {selectedType === "date" ? (
                                <input
                                    type="date"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            ) : selectedType === "number" ? (
                                <input
                                    type="number"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="Enter a number"
                                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            ) : (
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => {
                                            setInputValue(e.target.value);
                                            setShowSuggestions(true);
                                        }}
                                        onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                                        placeholder={
                                            selectedType === "course"
                                                ? "Search courses..."
                                                : selectedType === "assignment"
                                                  ? "Search assignments..."
                                                  : selectedType === "class"
                                                    ? "Enter class name..."
                                                    : "Enter tag value..."
                                        }
                                        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        autoFocus
                                    />
                                    {showSuggestions && suggestions.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-zinc-300 bg-white shadow-lg z-10 max-h-48 overflow-y-auto">
                                            {suggestions.map((s) => (
                                                <button
                                                    key={s.id}
                                                    onClick={() => {
                                                        setInputValue(s.id);
                                                        setShowSuggestions(false);
                                                        handleAddTag();
                                                    }}
                                                    className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-blue-50 border-b border-zinc-100 last:border-b-0"
                                                >
                                                    <div className="font-medium">{s.name}</div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {(loadingCourses || loadingAssignments) && (
                                        <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-zinc-300 bg-white p-3 text-center text-xs text-zinc-500">
                                            Loading options...
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => setShowPopup(false)}
                                className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddTag}
                                disabled={!inputValue.trim()}
                                className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                                Add Tag
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Page Editor ──────────────────────────────────────────────────────────────

function PageEditor({
    page,
    onChange,
    allPages,
    setRightPanel,
}: {
    page: KnowledgeBasePage;
    onChange: (page: KnowledgeBasePage) => void;
    allPages: KnowledgeBasePage[];
    setRightPanel: (node: React.ReactNode | null) => void;
}) {
    const schema = useMemo(
        () => createCustomSchema(allPages, setRightPanel),
        [allPages, setRightPanel],
    );
    const editor = useCreateBlockNote({ initialContent: page.blocks, schema });

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;

        editor.onEditorContentChange(() => {
            clearTimeout(timeout);

            timeout = setTimeout(() => {
                onChange({
                    ...page,
                    blocks: structuredClone(editor.document) as PartialBlock[],
                });
            }, 500);
        });

        return () => {
            clearTimeout(timeout);
        };
    }, [editor, onChange, page]);

    const getSlashMenuItems = async (query: string) => {
        const defaultItems = getDefaultReactSlashMenuItems(editor);
        const customItems: DefaultReactSuggestionItem[] = [
            {
                title: "Database",
                subtext: "Insert a database table",
                onItemClick: () => {
                    editor.insertBlocks(
                        [
                            {
                                type: "database",
                                props: {
                                    title: "New Database",
                                    columnsJson: "[]",
                                    entriesJson: "[]",
                                },
                            },
                        ],
                        editor.getTextCursorPosition().block,
                        "after",
                    );
                },
                group: "Custom",
                icon: <Database size={18} />,
            },
            {
                title: "Page Link",
                subtext: "Link to another page",
                onItemClick: () => {
                    editor.insertBlocks(
                        [{ type: "pageLink", props: { pageId: "", pageTitle: "" } }],
                        editor.getTextCursorPosition().block,
                        "after",
                    );
                },
                group: "Custom",
                icon: <LinkIcon size={18} />,
            },
            {
                title: "Embed",
                subtext: "Embed a URL as an iframe",
                onItemClick: () => {
                    editor.insertBlocks(
                        [{ type: "embed", props: { url: "", title: "" } }],
                        editor.getTextCursorPosition().block,
                        "after",
                    );
                },
                group: "Custom",
                icon: <Code size={18} />,
            },
        ];
        return [...defaultItems, ...customItems].filter(
            (item) => !query || item.title.toLowerCase().includes(query.toLowerCase()),
        );
    };

    return (
        <div className="flex h-full flex-col bg-gradient-to-b from-white via-white to-zinc-50">
            <div className="border-b border-zinc-200 bg-white">
                <div className="px-8 pt-8 pb-4">
                    <input
                        value={page.title}
                        onChange={(e) => onChange({ ...page, title: e.target.value })}
                        placeholder="Untitled page"
                        className="w-full bg-transparent text-4xl font-bold text-zinc-900 placeholder-zinc-300 outline-none tracking-tight leading-tight"
                    />
                    <div className="mt-2 h-1 w-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" />
                </div>
                <TagInput
                    tags={page.tags || []}
                    onTagsChange={(tags) => onChange({ ...page, tags })}
                />
            </div>
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto px-8 py-8">
                    <BlockNoteView editor={editor} theme="light" slashMenu={false}>
                        <SuggestionMenuController
                            triggerCharacter="/"
                            getItems={getSlashMenuItems}
                        />
                    </BlockNoteView>
                </div>
            </div>
        </div>
    );
}

// ─── Page Tree ────────────────────────────────────────────────────────────────

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
                        className={`group flex items-center rounded-lg px-3 py-2 cursor-pointer transition-all duration-200 ${selectedPageId === page.id ? "bg-blue-100 text-blue-900 shadow-sm" : "text-zinc-700 hover:bg-zinc-100"}`}
                        style={{ paddingLeft: `${level * 16 + 12}px` }}
                        onClick={() => setSelectedPageId(page.id)}
                    >
                        <div className="flex-1 min-w-0">
                            <p
                                className={`truncate text-sm font-medium ${selectedPageId === page.id ? "text-blue-900" : "text-zinc-700 group-hover:text-zinc-900"}`}
                            >
                                {page.title || "Untitled"}
                            </p>
                            {page.tags && page.tags.length > 0 && (
                                <p className="text-xs text-zinc-400 truncate mt-0.5">
                                    {page.tags.length} tag{page.tags.length !== 1 ? "s" : ""}
                                </p>
                            )}
                        </div>
                        <button
                            className="opacity-0 group-hover:opacity-100 ml-2 shrink-0 p-1 rounded hover:bg-white/50 transition-all"
                            onClick={(e) => {
                                e.stopPropagation();
                                const child: KnowledgeBasePage = {
                                    id: crypto.randomUUID(),
                                    title: "Untitled",
                                    blocks: [{ type: "paragraph", content: [] }],
                                    children: [],
                                };
                                setKnowledgeBase({
                                    ...knowledgeBase,
                                    pages: addChildPage(knowledgeBase.pages, page.id, child),
                                });
                                setSelectedPageId(child.id);
                            }}
                        >
                            <Plus size={14} />
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

// ─── Tree utilities ───────────────────────────────────────────────────────────

function findPageById(pages: KnowledgeBasePage[], id: string | null): KnowledgeBasePage | null {
    for (const page of pages) {
        if (page.id === id) return page;
        const child = findPageById(page.children, id);
        if (child) return child;
    }
    return null;
}

function updatePageById(
    pages: KnowledgeBasePage[],
    id: string,
    updatedPage: KnowledgeBasePage,
): KnowledgeBasePage[] {
    return pages.map((page) =>
        page.id === id
            ? updatedPage
            : { ...page, children: updatePageById(page.children, id, updatedPage) },
    );
}

function addChildPage(
    pages: KnowledgeBasePage[],
    parentId: string,
    child: KnowledgeBasePage,
): KnowledgeBasePage[] {
    return pages.map((page) =>
        page.id === parentId
            ? { ...page, children: [...page.children, child] }
            : { ...page, children: addChildPage(page.children, parentId, child) },
    );
}
