"use client";

import Link from "next/link";
import { useNavigation } from "@/context/navigationContext";
import { ChevronRight, Menu } from "lucide-react";
import { ComponentType } from "react";

// Icon mapping - you can expand this with more icons
const ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
    Home: require("lucide-react").Home,
    LayoutGrid: require("lucide-react").LayoutGrid,
    Clock: require("lucide-react").Clock,
    BookOpen: require("lucide-react").BookOpen,
    GraduationCap: require("lucide-react").GraduationCap,
    FileText: require("lucide-react").FileText,
    StickyNote: require("lucide-react").StickyNote,
    Settings: require("lucide-react").Settings,
};

export const Navigation = () => {
    const { items, layout, sidebarCollapsed, setSidebarCollapsed } = useNavigation();

    const visibleItems = items.filter((item) => item.visible);

    if (layout === "top") {
        return (
            <nav className="h-16 bg-slate-800 border-b border-slate-700 flex items-center px-6 gap-8 shadow-sm sticky top-0 z-40">
                <h1 className="font-bold text-white text-lg">schoolm8</h1>
                <div className="flex gap-1">
                    {visibleItems.map((item) => (
                        <Link
                            key={item.id}
                            href={item.href}
                            className="px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-all text-sm"
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>
            </nav>
        );
    }

    if (layout === "sidebar") {
        return (
            <aside
                className={`
                    bg-gradient-to-b from-slate-800 to-slate-900 border-r border-slate-700
                    flex flex-col h-screen fixed left-0 top-0 z-50
                    transition-all duration-300 ease-in-out
                    ${sidebarCollapsed ? "w-20" : "w-64"}
                    shadow-xl
                `}
            >
                {/* Logo */}
                <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                    {!sidebarCollapsed && (
                        <h2 className="text-white font-bold text-lg">schoolm8</h2>
                    )}
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="text-slate-400 hover:text-white transition-colors p-1"
                    >
                        <ChevronRight
                            className={`w-5 h-5 transform transition-transform ${
                                sidebarCollapsed ? "" : "rotate-180"
                            }`}
                        />
                    </button>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 overflow-y-auto p-3 space-y-2">
                    {visibleItems.map((item) => {
                        const IconComponent =
                            ICON_MAP[item.icon] || require("lucide-react").LayoutGrid;
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-all group"
                                title={item.label}
                            >
                                <IconComponent className="w-5 h-5 flex-shrink-0" />
                                {!sidebarCollapsed && <span className="text-sm">{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Settings Link */}
                <div className="border-t border-slate-700 p-3">
                    <Link
                        href="/settings/navigation"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
                        title="Navigation settings"
                    >
                        <Menu className="w-5 h-5 flex-shrink-0" />
                        {!sidebarCollapsed && <span className="text-sm">Customize</span>}
                    </Link>
                </div>
            </aside>
        );
    }

    // Hybrid layout (top bar + sidebar)
    return (
        <div>
            {/* Top Bar */}
            <nav className="h-14 bg-slate-800/50 backdrop-blur border-b border-slate-700 flex items-center px-6 gap-4 shadow-sm sticky top-0 z-40">
                <h1 className="font-bold text-white text-lg">schoolm8</h1>
                <div className="flex gap-1">
                    {visibleItems.slice(0, 4).map((item) => (
                        <Link
                            key={item.id}
                            href={item.href}
                            className="px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-all text-sm"
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>
            </nav>

            {/* Sidebar */}
            <aside
                className={`
                    bg-gradient-to-b from-slate-800 to-slate-900 border-r border-slate-700
                    flex flex-col h-[calc(100vh-3.5rem)] fixed left-0 top-14 z-40
                    transition-all duration-300 ease-in-out
                    ${sidebarCollapsed ? "w-20" : "w-64"}
                    shadow-xl
                `}
            >
                <nav className="flex-1 overflow-y-auto p-3 space-y-2">
                    {visibleItems.slice(4).map((item) => {
                        const IconComponent =
                            ICON_MAP[item.icon] || require("lucide-react").LayoutGrid;
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-all group"
                                title={item.label}
                            >
                                <IconComponent className="w-5 h-5 flex-shrink-0" />
                                {!sidebarCollapsed && <span className="text-sm">{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Settings Link */}
                <div className="border-t border-slate-700 p-3">
                    <Link
                        href="/settings/navigation"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
                        title="Navigation settings"
                    >
                        <Menu className="w-5 h-5 flex-shrink-0" />
                        {!sidebarCollapsed && <span className="text-sm">Customize</span>}
                    </Link>
                </div>
            </aside>

            {/* Content offset */}
            <div className="ml-0 md:ml-64 transition-all duration-300" />
        </div>
    );
};
