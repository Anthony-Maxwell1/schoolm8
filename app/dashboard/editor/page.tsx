"use client";

import { useLayout } from "@/context/layoutContext";
import { TileRegistry, PanelRegistry, RegistryNode } from "@/lib/tiles";
import { Dashboard } from "@/components/Dashboard";
import { useState, useRef, useEffect } from "react";
import { useAccessControl } from "@/lib/access/useAccessControl";
import { useCss } from "@/lib/css";

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
        updateTile,
        saveState,
        addPanel,
        addTile,
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

    const { css } = useCss();

    const style = css.app.dashboard.editor.main;

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
        <div className={style["ROOT-STYLE"]}>
            {pageEditorOpen && (
                <div className={style.editorOpen["ROOT-STYLE"]}>
                    <div className={style.editorOpen.inner["ROOT-STYLE"]}>
                        {/* HEADER */}
                        <div className={style.header["ROOT-STYLE"]}>
                            <div>
                                <h2 className={style.header.title["ROOT-STYLE"]}>Page Editor</h2>

                                <p className={style.header.subtitle["ROOT-STYLE"]}>
                                    Edit page details and settings
                                </p>
                            </div>

                            <button
                                className={style.header.closeButton["ROOT-STYLE"]}
                                onClick={() => setPageEditorOpen(false)}
                            >
                                ✕
                            </button>
                        </div>

                        {/* CONTENT */}
                        <div className={style.content["ROOT-STYLE"]}>
                            {/* Label */}
                            <div className={style.content.labelGroup["ROOT-STYLE"]}>
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
                                    className={style.content.input["ROOT-STYLE"]}
                                />
                            </div>

                            {/* DANGER ZONE */}
                            <div className={style.dangerZone["ROOT-STYLE"]}>
                                <div className={style.dangerZone.inner["ROOT-STYLE"]}>
                                    <div>
                                        <h3 className={style.dangerZone.title["ROOT-STYLE"]}>
                                            Delete Page
                                        </h3>

                                        <p className={style.dangerZone.desc["ROOT-STYLE"]}>
                                            This action cannot be undone.
                                        </p>
                                    </div>

                                    <button
                                        className={style.dangerZone.button["ROOT-STYLE"]}
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
                        <div className={style.footer["ROOT-STYLE"]}>
                            <button
                                className={style.footer.cancel["ROOT-STYLE"]}
                                onClick={() => setPageEditorOpen(false)}
                            >
                                Cancel
                            </button>

                            <button
                                className={style.footer.save["ROOT-STYLE"]}
                                onClick={() => setPageEditorOpen(false)}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {globalEditorOpen && (
                <div className={style.globalEditor.overlay["ROOT-STYLE"]}>
                    <div className={style.globalEditor.card["ROOT-STYLE"]}>
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
                            className={style.globalEditor.saveButton["ROOT-STYLE"]}
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
            <aside className={style.asideLeft["ROOT-STYLE"]}>
                <button onClick={addPage} className={style.asideLeft.pageButton["ROOT-STYLE"]}>
                    + Page
                </button>

                {pages.map((p) => (
                    <button
                        key={p.id}
                        className={style.asideLeft.pageItem["ROOT-STYLE"]}
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
            <aside className={style.registry["ROOT-STYLE"]}>
                <h3 className={style.registry.heading["ROOT-STYLE"]}>Tiles</h3>
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
                <div className={style.dragPreview["ROOT-STYLE"]} style={previewStyle}>
                    {draggingNode.label}
                </div>
            )}
            <button
                className={style.floatingButtons.globalOptions["ROOT-STYLE"]}
                onClick={() => setGlobalEditorOpen(true)}
            >
                Global Options
            </button>
            <a className={style.floatingButtons.backLink["ROOT-STYLE"]} href="/dashboard">
                Back to Dashboard
            </a>
        </div>
    );
}
