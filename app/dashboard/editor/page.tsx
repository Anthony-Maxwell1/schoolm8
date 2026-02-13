"use client";

import { useLayout } from "@/context/layoutContext";
import { TileRegistry, PanelRegistry, RegistryNode } from "@/lib/tiles";
import { Dashboard } from "@/components/Dashboard";
import { useState, useRef, useEffect } from "react";

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
    const { pages, currentPage, gridSize, addPage, setCurrentPage, addTile, addPanel, saveState } =
        useLayout();

    const dashboardRef = useRef<HTMLDivElement>(null);

    const [mounted, setMounted] = useState(false);
    const [draggingNode, setDraggingNode] = useState<RegistryNode | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [dragType, setDragType] = useState<"tile" | "panel" | null>(null);

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
                    addPanel({
                        id: crypto.randomUUID(),
                        registryId: draggingNode.id,
                        anchor: "left",
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
            left: rect.left + col * cellWidth,
            top: rect.top + row * cellHeight,
            width: cellWidth * Math.max(1, Math.round(gridSize.cols / 4)),
            height: cellHeight * Math.max(1, Math.round(gridSize.rows / 4)),
        };
    }

    return (
        <div className="h-screen flex relative">
            {/* pages */}
            <aside className="w-48 border-r p-2">
                <button onClick={addPage} className="w-full mb-2 bg-blue-600 text-white p-1">
                    + Page
                </button>

                {pages.map((p) => (
                    <button
                        key={p.id}
                        className="block w-full text-left p-1"
                        onClick={() => setCurrentPage(p.id)}
                    >
                        {p.id}
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
        </div>
    );
}
