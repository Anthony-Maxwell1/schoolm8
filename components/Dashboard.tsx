"use client";

import { useLayout } from "@/context/layoutContext";
import { TileRegistry, PanelRegistry } from "@/lib/tiles";
import { RegistryNode } from "@/lib/tiles";
import { useState, useRef, useEffect } from "react";
import { CircleX, Ellipsis } from "lucide-react";
import { useTheme } from "@/context/themeContext";
import { useAuth } from "@/context/authContext";
import { useCss } from "@/lib/css";

const findRegistry = (id: string, nodes: RegistryNode[]): RegistryNode | null => {
    for (const n of nodes) {
        if (n.id === id) return n;
        if (n.children) {
            const found = findRegistry(id, n.children);
            if (found) return found;
        }
    }
    return null;
};

export const Dashboard = ({ editable = false }: { editable?: boolean }) => {
    const { user, loading } = useAuth();

    const { currentPage, gridSize, removeTile, updateTile, saveState, removePanel } = useLayout();

    const { classes, topBar, extraHtml } = useTheme();
    const { css } = useCss();
    const style = css.components.Dashboard.main;

    const containerRef = useRef<HTMLDivElement>(null);
    const [resizingTile, setResizingTile] = useState<string | null>(null);
    const [movingTile, setMovingTile] = useState<string | null>(null);

    const [editorOpen, setEditorOpen] = useState(false);
    const [editorTile, setEditorTile] = useState<string | null>(null);

    const [bg, setBg] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const bg_ = window.localStorage.getItem("app-dashboard-bg");

        if (bg_ === "") {
            setBg(null);
        } else if (bg_) {
            setBg(bg_);
        } else {
            const defaultBg = "/images/backgrounds/builtin/0001.png";

            setBg(defaultBg);
            window.localStorage.setItem("app-dashboard-bg", defaultBg);
        }
    }, []);

    useEffect(() => {
        // if (loading) return;

        // if (!user) {
        //     router.push("/signin");
        //     return;
        // }
        if (!movingTile || !currentPage) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            const tile = currentPage.tiles.find((t) => t.id === movingTile);
            if (!tile) return;

            const cellWidth = rect.width / gridSize.cols;
            const cellHeight = rect.height / gridSize.rows;

            const relativeX = e.clientX - rect.left;
            const relativeY = e.clientY - rect.top;

            let newX = Math.round(relativeX / cellWidth);
            let newY = Math.round(relativeY / cellHeight);

            newX = Math.max(0, Math.min(gridSize.cols - tile.w, newX));
            newY = Math.max(0, Math.min(gridSize.rows - tile.h, newY));

            updateTile({
                ...tile,
                x: newX,
                y: newY,
            });
        };

        const handleMouseUp = () => {
            setMovingTile(null);
            saveState();
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [movingTile, currentPage, gridSize]);

    // IMPORTANT: hooks must run before any conditional return
    useEffect(() => {
        if (!resizingTile || !currentPage) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            const tile = currentPage.tiles.find((t) => t.id === resizingTile);
            if (!tile) return;

            const cellWidth = rect.width / gridSize.cols;
            const cellHeight = rect.height / gridSize.rows;

            const relativeX = e.clientX - rect.left;
            const relativeY = e.clientY - rect.top;

            let newW = Math.round(relativeX / cellWidth) - tile.x;
            let newH = Math.round(relativeY / cellHeight) - tile.y;

            newW = Math.max(1, newW);
            newH = Math.max(1, newH);

            updateTile({
                ...tile,
                w: newW,
                h: newH,
            });
        };

        const handleMouseUp = () => {
            setResizingTile(null);
            saveState();
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [resizingTile, currentPage, gridSize]);

    const openTileMenu = (tileId: string) => {
        setEditorTile(tileId);
        setEditorOpen(true);
    };

    if (!currentPage) return <div className="p-4">No page selected</div>;
    if (loading) return;

    const panelOffsets = {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    };

    currentPage.panels.forEach((panel) => {
        const amount = panel.size * 100;

        panelOffsets[panel.anchor] += amount;
    });

    const dashboardContentStyle: React.CSSProperties = {
        position: "absolute",
        left: `${panelOffsets.left}%`,
        right: `${panelOffsets.right}%`,
        top: `${panelOffsets.top}%`,
        bottom: `${panelOffsets.bottom}%`,
    };

    const panelStacks = {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    };

    return (
        <div
            ref={containerRef}
            className={style["ROOT-STYLE"]}
            style={bg ? { backgroundImage: `url(${bg})` } : undefined}
        >
            {" "}
            {editable && editorOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="rounded bg-white p-4 shadow">
                        <h2 className="text-xl font-semibold mb-4">Edit Tile {editorTile}</h2>
                        <h3 className="font-semibold text-lg mb-1">Special Effects</h3>
                        <input type="checkbox" id="movable" className="mr-3" />
                        <label htmlFor="movable" className="font-semibold">
                            Movable
                        </label>
                        <br></br>
                        <input type="checkbox" id="topBar" className="mr-3" />
                        <label htmlFor="topBar" className="font-semibold">
                            Top Bar
                        </label>
                        <br></br>
                        {/* Tile editing form goes here */}
                        <button
                            className="mt-4 rounded bg-blue-500 px-3 py-1 text-white"
                            onClick={() => {
                                const movable = (
                                    document.getElementById("movable") as HTMLInputElement
                                ).checked;
                                const topBar = (
                                    document.getElementById("topBar") as HTMLInputElement
                                ).checked;

                                const tile = currentPage.tiles.find((t) => t.id === editorTile);
                                if (!tile) return; // ⚠️ guard against undefined

                                const newSpecialEffects = [
                                    movable ? "movable" : "",
                                    topBar ? "topBar" : "",
                                ].filter(Boolean);
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

                                setEditorOpen(false);
                            }}
                        >
                            Save & Close
                        </button>
                    </div>
                </div>
            )}
            {/* GRID */}
            {editable && (
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${gridSize.cols}, 1fr)`,
                        gridTemplateRows: `repeat(${gridSize.rows}, 1fr)`,
                    }}
                >
                    {Array.from({ length: gridSize.cols * gridSize.rows }).map((_, i) => (
                        <div key={i} className="border border-gray-200" />
                    ))}
                </div>
            )}
            {/* PANELS */}
            {currentPage.panels.map((panel) => {
                const def = findRegistry(panel.registryId, PanelRegistry);
                if (!def?.component) return null;

                const PanelComponent = def.component;

                const style: React.CSSProperties = {
                    position: "absolute",
                };

                const offset = panelStacks[panel.anchor];

                if (panel.anchor === "left" || panel.anchor === "right") {
                    style.width = `${panel.size * 100}%`;
                    style.height = "100%";
                    style[panel.anchor] = `${offset}%`;

                    panelStacks[panel.anchor] += panel.size * 100;
                } else {
                    style.height = `${panel.size * 100}%`;
                    style.width = "100%";
                    style[panel.anchor] = `${offset}%`;

                    panelStacks[panel.anchor] += panel.size * 100;
                }

                return (
                    <div key={panel.id} style={style}>
                        {editable && (
                            <button
                                className="absolute right-0 top-0 z-10 text-3xl"
                                onClick={() => {
                                    removePanel(panel.id);
                                }}
                            >
                                {" "}
                                <CircleX className="cursor-pointer" />{" "}
                            </button>
                        )}
                        <PanelComponent {...panel.props} />
                    </div>
                );
            })}
            {/* TILES */}
            <div style={dashboardContentStyle}>
                {currentPage.tiles.map((tile) => {
                    const def = findRegistry(tile.registryId, TileRegistry);
                    if (!def?.component) return null;
                    const TileComponent = def.component;

                    let TopBarReplaced = topBar;
                    if (topBar) {
                        TopBarReplaced = topBar.replace("{__TILE_TITLE__}", def.label || "");
                    }

                    const style: React.CSSProperties = {
                        position: "absolute",
                        left: `${(tile.x / gridSize.cols) * 100}%`,
                        top: `${(tile.y / gridSize.rows) * 100}%`,
                        width: `${(tile.w / gridSize.cols) * 100}%`,
                        height: `${(tile.h / gridSize.rows) * 100}%`,
                    };

                    return (
                        <div
                            key={tile.id}
                            style={style}
                            className={
                                (tile.specialEffects?.includes("topBar")
                                    ? classes?.TileOuter
                                    : classes?.TileOuterNoTopBar) + " relative group"
                            }
                        >
                            {/* delete */}
                            {editable && (
                                <button
                                    className="absolute right-0 top-0 z-30 cursor-grab"
                                    onClick={() => {
                                        removeTile(tile.id);
                                    }}
                                >
                                    <CircleX className="cursor-pointer" />
                                </button>
                            )}
                            {TopBarReplaced && tile.specialEffects?.includes("topBar") && (
                                <div dangerouslySetInnerHTML={{ __html: TopBarReplaced }} />
                            )}
                            {extraHtml && <div dangerouslySetInnerHTML={{ __html: extraHtml }} />}
                            <div className={classes?.Tile || "border bg-white shadow"}>
                                <TileComponent {...tile.props} />
                                {editable && (
                                    <div
                                        className="absolute bottom-2 left-2 z-30"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            openTileMenu(tile.id);
                                        }}
                                    >
                                        <Ellipsis className="cursor-pointer z-50" />
                                    </div>
                                )}
                            </div>
                            {/* resize handle */}
                            {editable && (
                                <div
                                    className="absolute bottom-0 right-0 z-30 h-8 w-8 cursor-se-resize opacity-0"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setResizingTile(tile.id);
                                    }}
                                />
                            )}
                            {(editable || tile.specialEffects?.includes("movable")) && (
                                <div
                                    className="absolute left-0 top-0 z-30 h-7 w-7 cursor-move opacity-0"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setMovingTile(tile.id);
                                    }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
