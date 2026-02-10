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
                        className={`cursor-pointer p-1 rounded hover:bg-gray-200`}
                        onMouseDown={(e) => {
                            e.preventDefault(); // prevent text selection
                            onStartDrag(n, { x: e.clientX, y: e.clientY });
                        }}
                    >
                        {Component ? (
                            <Component />
                        ) : (
                            <span className="font-semibold">{n.label}</span>
                        )}
                    </div>

                    {n.children && n.children.length > 0 && (
                        <RegistryBrowser nodes={n.children} onStartDrag={onStartDrag} />
                    )}
                </li>
            );
        })}
    </ul>
);

export default function EditorPage() {
    const { pages, currentPage, addPage, setCurrentPage, addTile, addPanel } = useLayout();

    const dashboardRef = useRef<HTMLDivElement>(null);

    const [draggingNode, setDraggingNode] = useState<RegistryNode | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [dragType, setDragType] = useState<"tile" | "panel" | null>(null);

    // Track mouse while dragging
    useEffect(() => {
        if (!draggingNode) return;

        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };

        const handleMouseUp = (e: MouseEvent) => {
            // Check if dropped inside dashboard
            if (dashboardRef.current) {
                const rect = dashboardRef.current.getBoundingClientRect();
                if (
                    e.clientX >= rect.left &&
                    e.clientX <= rect.right &&
                    e.clientY >= rect.top &&
                    e.clientY <= rect.bottom
                ) {
                    const relativeX = e.clientX - rect.left;
                    const relativeY = e.clientY - rect.top;

                    if (dragType === "tile") {
                        addTile({
                            id: crypto.randomUUID(),
                            registryId: draggingNode.id,
                            x: (relativeX / rect.width) * 20, // scale to grid
                            y: (relativeY / rect.height) * 10,
                            w: 20 / 3,
                            h: 10 / 3,
                            props: draggingNode.defaultProps ?? {},
                        });
                    } else if (dragType === "panel") {
                        addPanel({
                            id: crypto.randomUUID(),
                            registryId: draggingNode.id,
                            anchor: "left", // can implement snap-to-side
                            size: 0.2,
                            props: draggingNode.defaultProps ?? {},
                        });
                    }
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
    }, [draggingNode, dragType]);

    const startDrag = (node: RegistryNode, type: "tile" | "panel") => {
        setDraggingNode(node);
        setDragType(type);
    };

    return (
        <div className="h-screen flex relative">
            {/* Pages */}
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

            {/* Dashboard */}
            <main className="flex-1 relative" ref={dashboardRef}>
                <Dashboard editable />
            </main>

            {/* Registry */}
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

            {/* Drag preview */}
            {draggingNode && (
                <div
                    className={`absolute pointer-events-none border-2 border-blue-500 bg-blue-200 opacity-50`}
                    style={{
                        top: dragType === "tile" ? mousePos.y : mousePos.y - 50,
                        left: dragType === "tile" ? mousePos.x : mousePos.x - 100,
                        width: dragType === "tile" ? window.innerWidth / 3 : 200,
                        height: dragType === "tile" ? window.innerHeight / 3 : 100,
                    }}
                >
                    {draggingNode.label}
                </div>
            )}
        </div>
    );
}
