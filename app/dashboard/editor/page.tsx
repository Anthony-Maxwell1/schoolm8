"use client";

import { useLayout } from "@/context/layoutContext";
import { TileRegistry, PanelRegistry, RegistryNode } from "@/lib/tiles";
import { Dashboard } from "@/components/Dashboard";
import { useState, useRef, useEffect } from "react";
import { useAccessControl } from "@/lib/access/useAccessControl";

export const RegistryBrowser = ({
    nodes,
    onStartDrag,
}: {
    nodes: RegistryNode[];
    onStartDrag: (node: RegistryNode, initialMouse: { x: number; y: number }) => void;
}) => (
    <ul className="ml-2">
        {nodes.map((n) => {
            const Component = n.component;

            return (
                <li key={n.id} className="mb-1">
                    <div
                        className="cursor-pointer p-1 rounded hover:bg-gray-200"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            onStartDrag(n, { x: e.clientX, y: e.clientY });
                        }}
                    >
                        {Component ? (
                            <Component />
                        ) : (
                            <span className="font-semibold">{n.label}</span>
                        )}
                    </div>

                    {n.children && <RegistryBrowser nodes={n.children} onStartDrag={onStartDrag} />}
                </li>
            );
        })}
    </ul>
);

export default function EditorPage() {
    const { allowed, loading: accessLoading } = useAccessControl("dashboard/editor");
    const {
        currentPage,
        gridSize,
        removeTile,
        updateTile,
        saveState,
        addPanel,
        addTile,
        removePanel,
        addPage,
        pages,
        setCurrentPage,
        setPage,
        deletePage,
    } = useLayout();

    const [pageEditorOpen, setPageEditorOpen] = useState(false);

    const dashboardRef = useRef<HTMLDivElement>(null);

    const [mounted, setMounted] = useState(false);
    const [draggingNode, setDraggingNode] = useState<RegistryNode | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [dragType, setDragType] = useState<"tile" | "panel" | null>(null);
    const [globalEditorOpen, setGlobalEditorOpen] = useState(false);

    const [specialEffects, setSpecialEffects] = useState<string[]>([]);

    // prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    // drag tracking
    useEffect(() => {
        if (!draggingNode) return;

        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };

        const handleMouseUp = (e: MouseEvent) => {
            if (!dashboardRef.current) return;

            const rect = dashboardRef.current.getBoundingClientRect();

            const inside =
                e.clientX >= rect.left &&
                e.clientX <= rect.right &&
                e.clientY >= rect.top &&
                e.clientY <= rect.bottom;

            if (inside) {
                const relativeX = e.clientX - rect.left;
                const relativeY = e.clientY - rect.top;

                const col = Math.floor((relativeX / rect.width) * gridSize.cols);
                const row = Math.floor((relativeY / rect.height) * gridSize.rows);

                if (dragType === "tile") {
                    addTile({
                        id: crypto.randomUUID(),
                        registryId: draggingNode.id,
                        x: col,
                        y: row,
                        w: Math.max(1, Math.round(gridSize.cols / 4)),
                        h: Math.max(1, Math.round(gridSize.rows / 4)),
                        props: draggingNode.defaultProps ?? {},
                    });
                    saveState();
                }

                if (dragType === "panel") {
                    const isRight = e.clientX > rect.left + rect.width / 2;
                    const isBottom = e.clientY > rect.top + rect.height / 2;

                    let anchor: "left" | "right" | "top" | "bottom" = "left";

                    if (
                        Math.abs(e.clientX - rect.left - rect.width / 2) >
                        Math.abs(e.clientY - rect.top - rect.height / 2)
                    ) {
                        anchor = isRight ? "right" : "left";
                    } else {
                        anchor = isBottom ? "bottom" : "top";
                    }
                    addPanel({
                        id: crypto.randomUUID(),
                        registryId: draggingNode.id,
                        anchor,
                        size: 0.25,
                        props: draggingNode.defaultProps ?? {},
                    });
                    saveState();
                }
            }

            setDraggingNode(null);
            setDragType(null);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [draggingNode, dragType, gridSize]);

    if (accessLoading) return null;
    if (!allowed) return <div>Unauthorized</div>;

    if (!mounted) return null;

    const startDrag = (node: RegistryNode, type: "tile" | "panel") => {
        setDraggingNode(node);
        setDragType(type);
    };

    // preview snapped to grid
    let previewStyle: React.CSSProperties | undefined = undefined;

    if (draggingNode && dashboardRef.current && dragType === "tile") {
        const rect = dashboardRef.current.getBoundingClientRect();

        const col = Math.floor((mousePos.x - rect.left) / (rect.width / gridSize.cols));
        const row = Math.floor((mousePos.y - rect.top) / (rect.height / gridSize.rows));

        const cellWidth = rect.width / gridSize.cols;
        const cellHeight = rect.height / gridSize.rows;

        previewStyle = {
            position: "absolute",
            left: rect.left / 2 + col * cellWidth,
            top: row * cellHeight,
            width: cellWidth * Math.max(1, Math.round(gridSize.cols / 4)),
            height: cellHeight * Math.max(1, Math.round(gridSize.rows / 4)),
        };
    }

    return (
        <div className="h-screen flex relative">
            {pageEditorOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden">
                        {/* HEADER */}
                        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Page Editor</h2>

                                <p className="text-sm text-gray-500">
                                    Edit page details and settings
                                </p>
                            </div>

                            <button
                                className="
                    rounded-md px-2 py-1 text-sm text-gray-500
                    transition hover:bg-gray-100 hover:text-gray-700
                "
                                onClick={() => setPageEditorOpen(false)}
                            >
                                ✕
                            </button>
                        </div>

                        {/* CONTENT */}
                        <div className="flex flex-col gap-4 px-5 py-4">
                            {/* Label */}
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-gray-700">
                                    Page Label
                                </label>

                                <input
                                    type="text"
                                    placeholder="Enter page label..."
                                    value={currentPage?.label || ""}
                                    onChange={(a) => {
                                        setPage(currentPage?.id || "", {
                                            label: a.target.value,
                                        });
                                    }}
                                    className="
                        rounded-lg border border-gray-200
                        px-3 py-2 text-sm
                        outline-none transition
                        focus:border-blue-400 focus:ring-2 focus:ring-blue-100
                    "
                                />
                            </div>

                            {/* DANGER ZONE */}
                            <div className="rounded-xl border border-red-100 bg-red-50 p-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-medium text-red-700">
                                            Delete Page
                                        </h3>

                                        <p className="mt-1 text-xs text-red-600">
                                            This action cannot be undone.
                                        </p>
                                    </div>

                                    <button
                                        className="
                            rounded-lg bg-red-500 px-3 py-1.5
                            text-sm font-medium text-white
                            transition hover:bg-red-600
                        "
                                        onClick={() => {
                                            if (confirm("Delete page?")) {
                                                deletePage(currentPage?.id || "");
                                                setPageEditorOpen(false);
                                            }
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* FOOTER */}
                        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
                            <button
                                className="
                    rounded-lg px-4 py-2 text-sm font-medium
                    text-gray-600 transition hover:bg-gray-100
                "
                                onClick={() => setPageEditorOpen(false)}
                            >
                                Cancel
                            </button>

                            <button
                                className="
                    rounded-lg bg-blue-500 px-4 py-2
                    text-sm font-medium text-white
                    transition hover:bg-blue-600
                "
                                onClick={() => setPageEditorOpen(false)}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {globalEditorOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-4 rounded shadow-lg w-96">
                        <h2 className="text-xl font-bold mb-4">Global Editor</h2>
                        <input type="checkbox" id="movable" className="mr-3" />
                        <label htmlFor="movable" className="font-semibold">
                            Movable
                        </label>
                        <br />
                        <input type="checkbox" id="topBar" className="mr-3" />
                        <label htmlFor="topBar" className="font-semibold">
                            Top Bar
                        </label>
                        <br></br>
                        {/* Tile editing form goes here */}
                        <button
                            className="mt-4 px-3 py-1 bg-blue-500 text-white rounded"
                            onClick={() => {
                                const movable = (
                                    document.getElementById("movable") as HTMLInputElement
                                ).checked;

                                const topBar = (
                                    document.getElementById("topBar") as HTMLInputElement
                                ).checked;

                                const newSpecialEffects = [
                                    movable ? "movable" : "",
                                    topBar ? "topBar" : "",
                                ].filter(Boolean);

                                for (const tile of currentPage?.tiles ?? []) {
                                    updateTile({
                                        id: tile.id,
                                        registryId: tile.registryId,
                                        x: tile.x,
                                        y: tile.y,
                                        w: tile.w,
                                        h: tile.h,
                                        props: tile.props,
                                        specialEffects: newSpecialEffects,
                                    });
                                }

                                setGlobalEditorOpen(false);
                            }}
                        >
                            Save & Close
                        </button>
                    </div>
                </div>
            )}
            {/* pages */}
            <aside className="w-48 border-r p-2">
                <button
                    onClick={addPage}
                    className="w-full mb-2 bg-blue-600 text-white p-1 cursor-pointer"
                >
                    + Page
                </button>

                {pages.map((p) => (
                    <button
                        key={p.id}
                        className="block w-full text-left p-1"
                        onClick={() => setCurrentPage(p.id)}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            setCurrentPage(p.id);
                            setPageEditorOpen(true);
                        }}
                    >
                        {p.label}
                    </button>
                ))}
            </aside>

            {/* dashboard */}
            <main className="flex-1 relative" ref={dashboardRef}>
                <Dashboard editable />
            </main>

            {/* registry */}
            <aside className="w-64 border-l p-2 overflow-auto">
                <h3 className="font-bold">Tiles</h3>
                <RegistryBrowser
                    nodes={TileRegistry}
                    onStartDrag={(node, mouse) => {
                        setMousePos(mouse);
                        startDrag(node, "tile");
                    }}
                />

                <h3 className="font-bold mt-4">Panels</h3>
                <RegistryBrowser
                    nodes={PanelRegistry}
                    onStartDrag={(node, mouse) => {
                        setMousePos(mouse);
                        startDrag(node, "panel");
                    }}
                />
            </aside>

            {/* drag preview */}
            {draggingNode && dragType === "tile" && previewStyle && (
                <div
                    className="absolute pointer-events-none border-2 border-blue-500 bg-blue-200 opacity-50"
                    style={previewStyle}
                >
                    {draggingNode.label}
                </div>
            )}
            <button
                className="fixed bottom-14 right-4 bg-red-600 text-white px-3 py-1 rounded cursor-pointer"
                onClick={() => {
                    setGlobalEditorOpen(true);
                }}
            >
                Global Options
            </button>
            <a
                className="fixed bottom-4 right-4 bg-green-600 text-white px-3 py-1 rounded"
                href="/dashboard"
            >
                Back to Dashboard
            </a>
        </div>
    );
}
