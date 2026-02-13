"use client";

import { Dashboard } from "@/components/Dashboard";
import { useLayout } from "@/context/layoutContext";
import { useEffect, useState } from "react";
import { ChevronRight, Edit, Settings } from "lucide-react";

export default function DashboardPage() {
    const { currentPage, pages, setCurrentPage } = useLayout();
    const [mounted, setMounted] = useState(false);
    const [open, setOpen] = useState(false);

    // 1️⃣ mark component as mounted (client-side)
    useEffect(() => {
        setMounted(true);
    }, []);

    // 2️⃣ auto-select first page if none is selected
    useEffect(() => {
        if (!currentPage && pages.length > 0) {
            setCurrentPage(pages[0].id); // ✅ safe inside useEffect
        }
    }, [currentPage, pages, setCurrentPage]);

    // 3️⃣ prevent hydration mismatch by not rendering until mounted
    if (!mounted) return null;

    if (!currentPage) return <div>No pages available</div>;

    return (
       <div className="h-screen flex">
            {/* Dashboard */}
            <main className="flex-1">
                <Dashboard editable={false} />
            </main>
            {/* Semicircle tab with arrow */}
            <div
                className={`fixed left-0 bottom-20 flex items-center h-10 bg-blue-500 rounded-r-full shadow-lg transition-all duration-300
            ${open ? "w-25 px-3" : "w-10 px-0"}`}
            >
                {/* Toggle area */}
                <div
                    className="flex items-center justify-center w-10 h-10 cursor-pointer"
                    onClick={() => setOpen(!open)}
                >
                    <div
                        className={`transform transition-transform duration-300 ${
                            open ? "rotate-180 -translate-x-3" : "rotate-0"
                        }`}
                    >
                        <ChevronRight className="w-5 h-5 text-white" />
                    </div>
                </div>

                {/* Buttons (visible when open) */}
                {open && (
                    <div className="flex flex-row items-center ml-2 gap-2">
                        <div
                            className="w-6 h-6 flex items-center justify-center cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation(); // prevent toggle
                                window.location.href = "/dashboard/editor"; // navigate to editor
                                console.log("Edit clicked");
                            }}
                        >
                            <Edit className="text-white" />
                        </div>
                        <div
                            className="w-6 h-6 flex items-center justify-center cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                console.log("Settings clicked");
                            }}
                        >
                            <Settings className="text-white" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
