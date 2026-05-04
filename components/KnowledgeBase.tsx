"use client";

import { useEffect, useMemo, useState } from "react";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

import { BlockNoteEditor, PartialBlock } from "@blocknote/core";

import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { X, Plus, Tag as TagIcon } from "lucide-react";
import { useAuth } from "@/context/authContext";
import { useRef } from "react";

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
            <div className="w-72 border-r border-zinc-200 overflow-y-auto bg-gradient-to-b from-white to-zinc-50 flex flex-col">
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
                    <BlockNoteView editor={editor} theme="light" />
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
