// pages/test-dashboard.tsx
"use client";

import { useEffect } from "react";
import { useLayout } from "@/context/layoutContext";
import { Dashboard } from "@/components/Dashboard";

export default function DashboardPage() {
    const { pages, createPage, setCurrentPage, addPanel, currentPage } = useLayout();

    useEffect(() => {
        if (pages.length === 0) {
            // Create 2 pages with random tiles
            createPage("page1", [
                {
                    id: "tile1",
                    classKey: "Tile",
                    xStart: 0,
                    yStart: 0,
                    xEnd: 9,
                    yEnd: 4,
                },
                {
                    id: "tile2",
                    classKey: "Tile",
                    xStart: 10,
                    yStart: 0,
                    xEnd: 19,
                    yEnd: 4,
                },
            ]);

            createPage("page2", [
                {
                    id: "tile3",
                    classKey: "Tile",
                    xStart: 0,
                    yStart: 0,
                    xEnd: 4,
                    yEnd: 4,
                },
                {
                    id: "tile4",
                    classKey: "Tile",
                    xStart: 5,
                    yStart: 0,
                    xEnd: 9,
                    yEnd: 4,
                },
                {
                    id: "tile5",
                    classKey: "Tile",
                    xStart: 10,
                    yStart: 0,
                    xEnd: 19,
                    yEnd: 9,
                },
            ]);

            // Add left panel for switcher
            addPanel({
                id: "panel-left",
                anchor: "left",
                size: 0.15, // 15% width
            });
        }
    }, []);

    if (!currentPage) return <div>Loading...</div>;

    return (
        <div className="w-full h-screen flex">
            {/* Left panel for page switcher */}
            <div className="w-[15%] bg-gray-300 p-2 flex flex-col gap-2">
                {pages.map((page) => (
                    <button
                        key={page.id}
                        className="p-2 bg-white rounded hover:bg-gray-200"
                        onClick={() => setCurrentPage(page.id)}
                    >
                        {page.id}
                    </button>
                ))}
            </div>

            {/* Main dashboard */}
            <div className="flex-1 relative">
                <Dashboard />
            </div>
        </div>
    );
}
