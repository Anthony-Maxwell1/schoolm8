"use client";

import { useEffect, useMemo, useState } from "react";

// @ts-ignore
import "@blocknote/core/fonts/inter.css";
// @ts-ignore
import "@blocknote/mantine/style.css";

import { BlockNoteEditor, PartialBlock, BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
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

// Tag parsing and validation utilities
export const parseTag = (tag: string): ParsedTag | null => {
    const match = tag.match(/^([^:]+):(.+)$/);
    if (!match) return null;

    const [, type, value] = match;
    const normalizedType = type.toLowerCase();

    if (!["course", "assignment", "date", "class", "generic", "number"].includes(normalizedType)) {
        return null;
    }

    return {
        type: normalizedType as TagType,
        value,
        display: value,
    };
};

export const formatTag = (type: TagType, value: string): string => {
    return `${type}:${value}`;
};

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

// Create BlockNote custom block specs
const createDatabaseBlockSpec = (allPages: KnowledgeBasePage[]) =>
    createReactBlockSpec(
        {
            type: "database",
            propSchema: {
                title: {
                    default: "New Database",
                },
                columnsJson: {
                    default: "[]",
                },
                entriesJson: {
                    default: "[]",
                },
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
                    />
                );
            },
        },
    );

const createPageLinkBlockSpec = (allPages: KnowledgeBasePage[]) =>
    createReactBlockSpec(
        {
            type: "pageLink",
            propSchema: {
                pageId: {
                    default: "",
                },
                pageTitle: {
                    default: "",
                },
            },
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
                            props: {
                                pageId: data.pageId,
                                pageTitle: data.pageTitle,
                            },
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
            propSchema: {
                url: {
                    default: "",
                },
                title: {
                    default: "",
                },
            },
            content: "none",
        },
        {
            render: (props) => (
                <EmbedBlock
                    data={{
                        url: props.block.props.url,
                        title: props.block.props.title,
                    }}
                    onChange={(data) => {
                        props.editor.updateBlock(props.block, {
                            type: "embed",
                            props: {
                                url: data.url,
                                title: data.title,
                            },
                        });
                    }}
                />
            ),
        },
    );

// Create the custom schema with our blocks
const createCustomSchema = (allPages: KnowledgeBasePage[]) => {
    return BlockNoteSchema.create({
        blockSpecs: {
            ...defaultBlockSpecs,
            database: createDatabaseBlockSpec(allPages)(), // call () to get BlockSpec
            pageLink: createPageLinkBlockSpec(allPages)(),
            embed: createEmbedBlockSpec()(),
        },
    });
};

// Database Block Component
type SortConfig = { key: string; direction: "asc" | "desc" } | null;

function DatabaseBlock({
    data,
    title,
    columns,
    onChange,
    allPages,
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
    const [openPageEntryId, setOpenPageEntryId] = useState<string | null>(null);
    const openPageEntry = openPageEntryId ? dbEntries.find((e) => e.id === openPageEntryId) : null;

    // Debounced save to avoid thrashing
    const saveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (saveRef.current) clearTimeout(saveRef.current);
        saveRef.current = setTimeout(() => {
            onChange(dbTitle, dbColumns, dbEntries);
        }, 300);
        return () => {
            if (saveRef.current) clearTimeout(saveRef.current);
        };
    }, [dbTitle, dbColumns, dbEntries]); // intentionally omit onChange

    const addColumn = () => {
        if (!newColName.trim()) return;
        const col = { key: newColName.trim(), type: newColType };
        const updatedCols = [...dbColumns, col];
        const updatedEntries = dbEntries.map((entry) => ({
            ...entry,
            values: { ...entry.values, [col.key]: { type: col.type, value: "" } },
        }));
        setDbColumns(updatedCols);
        setDbEntries(updatedEntries);
        setNewColName("");
        setNewColType("generic");
        setShowAddColumn(false);
    };

    const deleteColumn = (key: string) => {
        setDbColumns(dbColumns.filter((c) => c.key !== key));
        setDbEntries(
            dbEntries.map((entry) => {
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
            pageContent: [{ type: "paragraph", content: [] }],
            values: Object.fromEntries(
                dbColumns.map((col) => [col.key, { type: col.type, value: "" }]),
            ),
        };
        setDbEntries([...dbEntries, newEntry]);
    };

    const updateEntry = (entryId: string, key: string, value: string) => {
        setDbEntries(
            dbEntries.map((entry) =>
                entry.id === entryId
                    ? {
                          ...entry,
                          values: { ...entry.values, [key]: { ...entry.values[key], value } },
                      }
                    : entry,
            ),
        );
    };

    const deleteEntry = (entryId: string) => {
        setDbEntries(dbEntries.filter((entry) => entry.id !== entryId));
        if (selectedEntryId === entryId) setSelectedEntryId(null);
    };

    const toggleSort = (key: string) => {
        setSort((prev) => {
            if (prev?.key === key) {
                return prev.direction === "asc" ? { key, direction: "desc" } : null;
            }
            return { key, direction: "asc" };
        });
    };

    const processedEntries = useMemo(() => {
        let result = [...dbEntries];

        // Apply filters
        Object.entries(filters).forEach(([key, filterVal]) => {
            if (!filterVal) return;
            result = result.filter((entry) =>
                (entry.values[key]?.value || "").toLowerCase().includes(filterVal.toLowerCase()),
            );
        });

        // Apply sort
        if (sort) {
            result.sort((a, b) => {
                const aVal = a.values[sort.key]?.value || "";
                const bVal = b.values[sort.key]?.value || "";
                const col = dbColumns.find((c) => c.key === sort.key);
                let cmp = 0;
                if (col?.type === "number") {
                    cmp = (parseFloat(aVal) || 0) - (parseFloat(bVal) || 0);
                } else if (col?.type === "date") {
                    cmp = new Date(aVal).getTime() - new Date(bVal).getTime();
                } else {
                    cmp = aVal.localeCompare(bVal);
                }
                return sort.direction === "asc" ? cmp : -cmp;
            });
        }

        return result;
    }, [dbEntries, filters, sort, dbColumns]);

    const selectedEntry = selectedEntryId ? dbEntries.find((e) => e.id === selectedEntryId) : null;

    return (
        <div
            className="my-4 rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden"
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

            <div className="flex">
                {/* Table */}
                <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="border-b border-zinc-200 bg-zinc-50">
                                <th className="px-3 py-2 text-left font-medium text-zinc-600 border-r border-zinc-100 whitespace-nowrap w-48">
                                    <div className="flex items-center gap-1 text-xs">
                                        <FileText size={12} />
                                        Name
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
                                    className={`border-b border-zinc-100 hover:bg-zinc-50 cursor-pointer transition-colors ${selectedEntryId === entry.id ? "bg-blue-50" : ""}`}
                                    onClick={() =>
                                        setSelectedEntryId(
                                            selectedEntryId === entry.id ? null : entry.id,
                                        )
                                    }
                                >
                                    <td
                                        className="px-3 py-2 border-r border-zinc-100 w-48"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="flex items-center gap-1.5 group/name">
                                            <button
                                                onClick={() => setOpenPageEntryId(entry.id)}
                                                className="flex items-center gap-1.5 min-w-0 hover:text-blue-600 transition-colors"
                                            >
                                                <div className="w-5 h-5 rounded bg-zinc-100 flex items-center justify-center flex-shrink-0 group-hover/name:bg-blue-100 transition-colors">
                                                    <FileText
                                                        size={11}
                                                        className="text-zinc-500 group-hover/name:text-blue-500"
                                                    />
                                                </div>
                                                <span className="text-sm font-medium text-zinc-800 truncate max-w-32 group-hover/name:text-blue-600">
                                                    {entry.name || "Untitled"}
                                                </span>
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenPageEntryId(entry.id);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 ml-auto text-zinc-400 hover:text-blue-500 transition-all"
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
                                                    setEditingCell({
                                                        entryId: entry.id,
                                                        key: col.key,
                                                    });
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
                                                        className="w-full rounded border border-blue-400 px-2 py-0.5 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                                                        onBlur={() => setEditingCell(null)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                ) : (
                                                    <span
                                                        className={`text-sm ${cell?.value ? "text-zinc-800" : "text-zinc-300"}`}
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
                                        colSpan={dbColumns.length + 1}
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

                {/* Entry detail panel */}
                {selectedEntry && (
                    <div className="w-72 border-l border-zinc-200 bg-white flex flex-col">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200">
                            <span className="text-sm font-semibold text-zinc-900">
                                Entry Details
                            </span>
                            <button
                                onClick={() => setSelectedEntryId(null)}
                                className="text-zinc-400 hover:text-zinc-600"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {dbColumns.map((col) => (
                                <div key={col.key}>
                                    <label className="flex items-center gap-1 text-xs font-medium text-zinc-500 mb-1">
                                        <span>{getTagIcon(col.type as TagType)}</span>
                                        {col.key}
                                    </label>
                                    <input
                                        type={
                                            col.type === "number"
                                                ? "number"
                                                : col.type === "date"
                                                  ? "date"
                                                  : "text"
                                        }
                                        value={selectedEntry.values[col.key]?.value || ""}
                                        onChange={(e) =>
                                            updateEntry(selectedEntry.id, col.key, e.target.value)
                                        }
                                        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-zinc-200">
                            <button
                                onClick={() => deleteEntry(selectedEntry.id)}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
                            >
                                <X size={14} /> Delete Entry
                            </button>
                        </div>
                    </div>
                )}
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
// Page Link Block Component
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
        <div className="my-2 inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm">
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
                            className="w-full border-b border-zinc-200 px-3 py-2 text-sm placeholder-zinc-400 outline-none focus:ring-1 focus:ring-blue-500"
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
                                    className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-blue-50 border-b border-zinc-100 last:border-b-0 transition-colors"
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

// Embed Block Component
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
        <div className="my-4 rounded-lg border border-zinc-200 p-4 bg-white">
            <div className="mb-2 flex items-center gap-2">
                <Code size={18} className="text-zinc-600" />
                {!isEditing && data.url && (
                    <span className="text-xs text-zinc-500">{data.url}</span>
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
                        className="w-full rounded border border-zinc-300 px-3 py-2 text-sm placeholder-zinc-400 outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                    />
                    <button
                        onClick={handleSave}
                        disabled={!tempUrl.trim()}
                        className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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

// Helper function to flatten page tree
function flattenPages(
    pages: KnowledgeBasePage[],
    depth: number = 0,
): (KnowledgeBasePage & { depth: number })[] {
    return pages.flatMap((page) => [{ ...page, depth }, ...flattenPages(page.children, depth + 1)]);
}

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
            <div className="w-72 border-r border-zinc-200 overflow-y-auto bg-linear-to-b from-white to-zinc-50 flex flex-col">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-zinc-200 px-5 py-6 z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                <TagIcon className="text-white" size={18} />
                            </div>
                            <h1 className="text-lg font-bold text-zinc-900">Knowledge Base</h1>
                        </div>
                    </div>
                </div>

                {/* Pages List */}
                <div className="flex-1 overflow-y-auto px-3 py-4">
                    <div className="mb-3 px-2">
                        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                            Pages
                        </h2>
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

                {/* Add Page Button */}
                <div className="border-t border-zinc-200 p-4 bg-white sticky bottom-0">
                    <button
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
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
                        <Plus size={18} />
                        <span>New Page</span>
                    </button>
                </div>
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-hidden">
                <PageEditor
                    key={selectedPage.id}
                    page={selectedPage}
                    allPages={knowledgeBase.pages}
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

    // Fetch courses when needed
    useEffect(() => {
        if (!token || selectedType !== "course") return;

        setLoadingCourses(true);
        fetch("/api/lms/courses", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.courses) {
                    setCourses(data.courses);
                }
            })
            .catch((err) => console.error("Failed to fetch courses:", err))
            .finally(() => setLoadingCourses(false));
    }, [token, selectedType]);

    // Fetch assignments when needed
    useEffect(() => {
        if (!token || selectedType !== "assignment") return;

        setLoadingAssignments(true);
        fetch("/api/lms/assignments", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.assignments) {
                    setAssignments(data.assignments);
                }
            })
            .catch((err) => console.error("Failed to fetch assignments:", err))
            .finally(() => setLoadingAssignments(false));
    }, [token, selectedType]);

    const handleAddTag = () => {
        if (!inputValue.trim()) return;

        let tagValue = inputValue.trim();

        // Validate based on type
        if (selectedType === "number" && isNaN(Number(tagValue))) {
            alert("Please enter a valid number");
            return;
        }

        if (selectedType === "date") {
            const dateObj = new Date(tagValue);
            if (isNaN(dateObj.getTime())) {
                alert("Please enter a valid date");
                return;
            }
            tagValue = dateObj.toISOString().split("T")[0];
        }

        const newTag = formatTag(selectedType, tagValue);

        if (!tags.includes(newTag)) {
            onTagsChange([...tags, newTag]);
        }

        setInputValue("");
        setShowSuggestions(false);
        setShowPopup(false);
    };

    const handleRemoveTag = (index: number) => {
        onTagsChange(tags.filter((_, i) => i !== index));
    };

    const getSuggestions = () => {
        if (!inputValue.trim()) return [];

        const query = inputValue.toLowerCase();

        if (selectedType === "course") {
            return Object.entries(courses)
                .filter(([_, course]) => course.name.toLowerCase().includes(query))
                .slice(0, 5)
                .map(([id, course]) => ({ id, name: course.name }));
        }

        if (selectedType === "assignment") {
            return Object.entries(assignments)
                .filter(([_, assignment]) => assignment.title.toLowerCase().includes(query))
                .slice(0, 5)
                .map(([id, assignment]) => ({ id: id, name: assignment.title }));
        }

        return [];
    };

    const suggestions = getSuggestions();
    const parsedTags = tags.map((tag) => parseTag(tag)).filter((t) => t !== null) as ParsedTag[];

    return (
        <div className="border-b border-zinc-200 px-6 py-4">
            {/* Tags Display */}
            <div className="flex items-center gap-2 flex-wrap mb-3">
                {parsedTags.length === 0 ? (
                    <span className="text-sm text-zinc-400 italic">No tags yet</span>
                ) : (
                    parsedTags.map((tag, index) => (
                        <div
                            key={index}
                            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border ${getTagColor(tag.type)} transition-all hover:shadow-md`}
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
                                onClick={() => handleRemoveTag(index)}
                                className="hover:opacity-70 transition-opacity ml-0.5"
                            >
                                <X size={13} />
                            </button>
                        </div>
                    ))
                )}

                {/* Add Tag Button */}
                <button
                    onClick={() => setShowPopup(!showPopup)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors border border-zinc-300"
                >
                    <Plus size={13} />
                    <span>Add tag</span>
                </button>
            </div>

            {/* Tag Creation Popup */}
            {showPopup && (
                <div
                    ref={popupRef}
                    onMouseLeave={() => setShowPopup(false)}
                    className="fixed z-50 bg-white rounded-xl shadow-xl border border-zinc-200 p-4 w-80 animate-in fade-in duration-200"
                    style={{
                        top: "150px",
                        left: "50%",
                        transform: "translateX(-50%)",
                    }}
                >
                    <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <TagIcon size={18} className="text-zinc-700" />
                                <h3 className="font-semibold text-zinc-900">Create Tag</h3>
                            </div>
                            <button
                                onClick={() => setShowPopup(false)}
                                className="text-zinc-400 hover:text-zinc-600 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Type Selector */}
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
                                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="generic">🏷️ Generic</option>
                                <option value="course">📚 Course</option>
                                <option value="assignment">✓ Assignment</option>
                                <option value="date">📅 Date</option>
                                <option value="class">🎓 Class</option>
                                <option value="number"># Number</option>
                            </select>
                        </div>

                        {/* Input Field */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wide">
                                Value
                            </label>
                            <div className="relative">
                                {selectedType === "date" ? (
                                    <input
                                        type="date"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                ) : selectedType === "number" ? (
                                    <input
                                        type="number"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter a number"
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
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    handleAddTag();
                                                }
                                            }}
                                            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder={
                                                selectedType === "course"
                                                    ? "Search courses..."
                                                    : selectedType === "assignment"
                                                      ? "Search assignments..."
                                                      : selectedType === "class"
                                                        ? "Enter class name..."
                                                        : "Enter tag value..."
                                            }
                                            autoFocus
                                        />

                                        {/* Suggestions Dropdown */}
                                        {showSuggestions && suggestions.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-zinc-300 bg-white shadow-lg z-10 max-h-48 overflow-y-auto">
                                                {suggestions.map((suggestion) => (
                                                    <button
                                                        key={suggestion.id}
                                                        onClick={() => {
                                                            setInputValue(suggestion.id);
                                                            setShowSuggestions(false);
                                                            handleAddTag();
                                                        }}
                                                        className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-blue-50 transition-colors border-b border-zinc-100 last:border-b-0"
                                                    >
                                                        <div className="font-medium">
                                                            {suggestion.name}
                                                        </div>
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
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => setShowPopup(false)}
                                className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddTag}
                                disabled={!inputValue.trim()}
                                className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

function PageEditor({
    page,
    onChange,
    allPages,
}: {
    page: KnowledgeBasePage;
    onChange: (page: KnowledgeBasePage) => void;
    allPages: KnowledgeBasePage[];
}) {
    const schema = useMemo(() => createCustomSchema(allPages), []);

    const editor = useCreateBlockNote({
        initialContent: page.blocks,
        schema: schema,
    });

    useEffect(() => {
        const save = async () => {
            const blocks = editor.document;

            onChange({
                ...page,
                blocks: blocks as PartialBlock[],
            });
        };

        editor.onEditorContentChange(save);
    }, [editor, onChange, page]);
    // Defined inside PageEditor so `editor` is the instance, not the class
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
            {/* Header Section */}
            <div className="border-b border-zinc-200 bg-white">
                {/* Title */}
                <div className="px-8 pt-8 pb-4">
                    <input
                        value={page.title}
                        onChange={(e) =>
                            onChange({
                                ...page,
                                title: e.target.value,
                            })
                        }
                        placeholder="Untitled page"
                        className="w-full bg-transparent text-4xl font-bold text-zinc-900 placeholder-zinc-300 outline-none tracking-tight"
                    />
                    <div className="mt-2 h-1 w-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
                </div>

                {/* Tags Section */}
                <TagInput
                    tags={page.tags || []}
                    onTagsChange={(tags) =>
                        onChange({
                            ...page,
                            tags,
                        })
                    }
                />
            </div>

            {/* Editor Area */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto px-8 py-8">
                    <style>{`
                        .bn-editor {
                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                        }
                        .bn-container {
                            padding: 0 !important;
                        }
                        .bn-editor strong {
                            font-weight: 600;
                            color: #18181b;
                        }
                        .bn-editor em {
                            font-style: italic;
                            color: #3f3f46;
                        }
                        .bn-editor h1 {
                            font-size: 1.875rem;
                            font-weight: 700;
                            margin-top: 1.5em;
                            margin-bottom: 0.5em;
                            color: #09090b;
                        }
                        .bn-editor h2 {
                            font-size: 1.5rem;
                            font-weight: 600;
                            margin-top: 1.25em;
                            margin-bottom: 0.5em;
                            color: #18181b;
                        }
                        .bn-editor h3 {
                            font-size: 1.25rem;
                            font-weight: 600;
                            margin-top: 1em;
                            margin-bottom: 0.5em;
                            color: #27272a;
                        }
                        .bn-editor p {
                            margin: 0.75em 0;
                            line-height: 1.625;
                            color: #3f3f46;
                        }
                        .bn-editor ul, .bn-editor ol {
                            margin: 0.75em 0;
                            padding-left: 1.5em;
                        }
                        .bn-editor li {
                            margin: 0.375em 0;
                            color: #3f3f46;
                        }
                        .bn-editor blockquote {
                            border-left: 4px solid #e4e4e7;
                            padding-left: 1rem;
                            margin: 1em 0;
                            color: #71717a;
                            font-style: italic;
                        }
                        .bn-editor code {
                            background-color: #f4f4f5;
                            padding: 0.125em 0.375em;
                            border-radius: 0.25rem;
                            font-family: "Monaco", "Courier New", monospace;
                            font-size: 0.875em;
                            color: #d4463f;
                        }
                        .bn-editor pre {
                            background-color: #18181b;
                            color: #e4e4e7;
                            padding: 1rem;
                            border-radius: 0.5rem;
                            overflow-x: auto;
                            margin: 1em 0;
                            line-height: 1.5;
                        }
                        .bn-editor pre code {
                            background-color: transparent;
                            color: inherit;
                            padding: 0;
                        }
                        .bn-editor a {
                            color: #2563eb;
                            text-decoration: underline;
                            transition: color 0.2s;
                        }
                        .bn-editor a:hover {
                            color: #1d4ed8;
                        }
                    `}</style>
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
                        className={`group flex items-center rounded-lg px-3 py-2 cursor-pointer transition-all duration-200 ${
                            selectedPageId === page.id
                                ? "bg-blue-100 text-blue-900 shadow-sm"
                                : "text-zinc-700 hover:bg-zinc-100"
                        }`}
                        style={{
                            paddingLeft: `${level * 16 + 12}px`,
                        }}
                        onClick={() => setSelectedPageId(page.id)}
                    >
                        <div className="flex-1 min-w-0">
                            <p
                                className={`truncate text-sm font-medium ${
                                    selectedPageId === page.id
                                        ? "text-blue-900"
                                        : "text-zinc-700 group-hover:text-zinc-900"
                                }`}
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
                            className="opacity-0 group-hover:opacity-100 ml-2 flex-shrink-0 p-1 rounded hover:bg-white/50 transition-all"
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
