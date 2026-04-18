"use client";

import { Dashboard } from "@/components/Dashboard";
import { useLayout } from "@/context/layoutContext";
import { useEffect, useState } from "react";
import { ChevronRight, Edit, HelpCircle, Settings } from "lucide-react";

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

    if (!currentPage)
        return (
            <div className="h-screen flex items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
                <div className="text-center max-w-md px-6">
                    {/* Icon / visual hint */}
                    <div className="mx-auto w-14 h-14 rounded-2xl bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center mb-4">
                        <HelpCircle className="w-6 h-6 text-neutral-600 dark:text-neutral-300" />
                    </div>

                    {/* Title */}
                    <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                        No pages available
                    </h1>

                    {/* Subtitle */}
                    <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                        You don’t have any pages yet. Create your first one to get started.
                    </p>

                    {/* Action button */}
                    <a
                        href="/dashboard/editor"
                        className="mt-6 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                        <Edit className="w-4 h-4" />
                        Editor
                    </a>
                </div>
            </div>
        );

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
                                window.location.href = "/settings"; // navigate to settings
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
