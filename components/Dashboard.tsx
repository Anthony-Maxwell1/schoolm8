"use client";

import { useLayout } from "@/context/layoutContext";
import { TileRegistry, PanelRegistry } from "@/lib/tiles";
import { RegistryNode } from "@/lib/tiles";
import { useState, useRef, useEffect } from "react";
import { CircleX } from "lucide-react";
import { useTheme } from "@/context/themeContext";

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
    const { currentPage, gridSize, removeTile, updateTile, saveState, removePanel } = useLayout();

    const { classes, topBar } = useTheme();

    const containerRef = useRef<HTMLDivElement>(null);
    const [resizingTile, setResizingTile] = useState<string | null>(null);
    const [movingTile, setMovingTile] = useState<string | null>(null);

    useEffect(() => {
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

    if (!currentPage) return <div className="p-4">No page selected</div>;

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full overflow-hidden bg-[url('/images/backgrounds/builtin/0001.png')] bg-cover"
        >
            {/* GRID */}
            {editable && (
                <div
                    className="absolute inset-0 pointer-events-none"
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

                const style: React.CSSProperties = { position: "absolute" };

                if (panel.anchor === "left" || panel.anchor === "right") {
                    style.width = `${panel.size * 100}%`;
                    style.height = "100%";
                    style[panel.anchor] = 0;
                } else {
                    style.height = `${panel.size * 100}%`;
                    style.width = "100%";
                    style[panel.anchor] = 0;
                }

                return (
                    <div key={panel.id} style={style}>
                        {/* delete */}
                        {editable && (
                            <button
                                className="absolute top-0 right-0 text-3xl z-10"
                                onClick={() => {
                                    removePanel(panel.id);
                                }}
                            >
                                <CircleX className="cursor-pointer" />
                            </button>
                        )}
                        <PanelComponent {...panel.props} />
                    </div>
                );
            })}

            {/* TILES */}
            {currentPage.tiles.map((tile) => {
                const def = findRegistry(tile.registryId, TileRegistry);
                if (!def?.component) return null;
                const TileComponent = def.component;

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
                        className={classes?.TileOuter + " relative group"}
                    >
                        {/* delete */}
                        {editable && (
                            <button
                                className="absolute top-0 right-0 z-10 cursor-grab"
                                onClick={() => {
                                    removeTile(tile.id);
                                }}
                            >
                                <CircleX className="cursor-pointer" />
                            </button>
                        )}
                        {topBar && <div dangerouslySetInnerHTML={{ __html: topBar }} />}
                        <div className={classes?.Tile || "border bg-white shadow"}>
                            <TileComponent {...tile.props} />
                        </div>
                        {/* resize handle */}
                        {editable && (
                            <div
                                className="absolute bottom-0 right-0 w-8 h-8 cursor-se-resize opacity-0"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setResizingTile(tile.id);
                                }}
                            />
                        )}
                        {editable && (
                            <div
                                className="absolute top-0 left-0 w-8 h-8 cursor-move opacity-0"
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
    );
};
