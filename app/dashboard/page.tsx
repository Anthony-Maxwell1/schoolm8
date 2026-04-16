"use client";

import { Dashboard } from "@/components/Dashboard";
import { useLayout } from "@/context/layoutContext";
import { useAuth } from "@/context/authContext";
import { useEffect, useState } from "react";
import { ChevronRight, Edit, Settings, Plus, Trash2, Home, BookOpen, Clock } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
    const { currentPage, pages, setCurrentPage, addPage, removePage } = useLayout();
    const { user } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [wallpaper, setWallpaper] = useState("/images/backgrounds/builtin/0001.png");

    // 1️⃣ mark component as mounted (client-side)
    useEffect(() => {
        setMounted(true);
        // Load wallpaper setting from localStorage
        const saved = localStorage.getItem("dashboard_wallpaper");
        if (saved) setWallpaper(saved);
    }, []);

    // 2️⃣ auto-select first page if none is selected
    useEffect(() => {
        if (!currentPage && pages.length > 0) {
            setCurrentPage(pages[0].id);
        }
    }, [currentPage, pages, setCurrentPage]);

    // 3️⃣ prevent hydration mismatch by not rendering until mounted
    if (!mounted) return null;

    const handleNewPage = () => {
        const name = prompt("Enter page name:");
        if (name) {
            addPage();
            // TODO: Add page name to the page object
        }
    };

    const handleRemovePage = (id: string) => {
        if (confirm("Are you sure you want to delete this page?")) {
            removePage(id);
        }
    };

    return (
        <div className="h-screen flex bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
            {/* SIDEBAR - Page Navigation */}
            <aside
                className={`
                    bg-gradient-to-b from-slate-800 to-slate-900 border-r border-slate-700
                    flex flex-col h-full
                    transition-all duration-300 ease-in-out
                    ${sidebarOpen ? "w-64" : "w-20"}
                    shadow-xl
                `}
            >
                {/* Logo / Home */}
                <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                    {sidebarOpen && <h2 className="text-white font-bold text-lg">schoolm8</h2>}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="text-slate-400 hover:text-white transition-colors p-1"
                        title={sidebarOpen ? "Collapse" : "Expand"}
                    >
                        <ChevronRight
                            className={`w-5 h-5 transform transition-transform ${
                                sidebarOpen ? "rotate-180" : ""
                            }`}
                        />
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 overflow-y-auto p-3 space-y-2">
                    <Link
                        href="/"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-all group"
                        title="Home"
                    >
                        <Home className="w-5 h-5 flex-shrink-0" />
                        {sidebarOpen && <span className="text-sm">Home</span>}
                    </Link>
                    <Link
                        href="/timetable"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-all group"
                        title="Timetable"
                    >
                        <Clock className="w-5 h-5 flex-shrink-0" />
                        {sidebarOpen && <span className="text-sm">Timetable</span>}
                    </Link>
                    <Link
                        href="/courses"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-all group"
                        title="Courses"
                    >
                        <BookOpen className="w-5 h-5 flex-shrink-0" />
                        {sidebarOpen && <span className="text-sm">Courses</span>}
                    </Link>
                </nav>

                {/* Dashboard Pages */}
                <div className="border-t border-slate-700 p-3">
                    {sidebarOpen && (
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                            Dashboard Pages
                        </h3>
                    )}
                    <div className="space-y-2 mb-3">
                        {pages.map((page) => (
                            <div
                                key={page.id}
                                className={`
                                    flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all
                                    ${
                                        currentPage?.id === page.id
                                            ? "bg-emerald-600 text-white shadow-lg"
                                            : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                                    }
                                `}
                                onClick={() => setCurrentPage(page.id)}
                                title="Click to switch page"
                            >
                                {sidebarOpen && (
                                    <span className="flex-1 text-sm truncate">
                                        Page {pages.indexOf(page) + 1}
                                    </span>
                                )}
                                {sidebarOpen && currentPage?.id === page.id && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemovePage(page.id);
                                        }}
                                        className="p-1 hover:bg-red-600 rounded transition-colors"
                                        title="Delete page"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={handleNewPage}
                        className={`
                            w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg
                            bg-emerald-600 text-white hover:bg-emerald-700 transition-all
                            text-sm font-medium
                        `}
                        title="Create new dashboard page"
                    >
                        <Plus className="w-4 h-4" />
                        {sidebarOpen && <span>New Page</span>}
                    </button>
                </div>

                {/* Settings & Editor */}
                <div className="border-t border-slate-700 p-3 space-y-2">
                    <Link
                        href="/dashboard/editor"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
                        title="Edit layout"
                    >
                        <Edit className="w-5 h-5 flex-shrink-0" />
                        {sidebarOpen && <span className="text-sm">Edit</span>}
                    </Link>
                    <Link
                        href="/settings/themes"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
                        title="Settings"
                    >
                        <Settings className="w-5 h-5 flex-shrink-0" />
                        {sidebarOpen && <span className="text-sm">Settings</span>}
                    </Link>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* TOP BAR */}
                <div className="h-14 border-b border-slate-700 bg-slate-800/50 backdrop-blur flex items-center justify-between px-6 shadow-sm">
                    <h1 className="text-white font-semibold">Dashboard</h1>
                    <div className="flex items-center gap-3">
                        <div className="text-slate-400 text-sm">
                            Welcome, {user?.displayName || "User"}
                        </div>
                    </div>
                </div>

                {/* DASHBOARD AREA */}
                <div className="flex-1 overflow-hidden relative">
                    {!currentPage ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <p className="text-slate-300 text-lg mb-4">
                                    No dashboard pages yet
                                </p>
                                <button
                                    onClick={handleNewPage}
                                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                                >
                                    Create First Page
                                </button>
                            </div>
                        </div>
                    ) : (
                        <Dashboard editable={false} wallpaper={wallpaper} />
                    )}
                </div>
            </main>
        </div>
    );
}
