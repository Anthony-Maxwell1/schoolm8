"use client";

import Link from "next/link";
import { useNavigation } from "@/context/navigationContext";
import { ChevronDown, ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import { ComponentType, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

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

export const Navigation = ({ children }: { children: React.ReactNode }) => {
    const { items, sidebarCollapsed, setSidebarCollapsed } = useNavigation();
    const pathname = usePathname();

    const visibleItems = items.filter((item) => item.visible);

    const isActive = (href: string) => pathname === href;

    const [hydrated, setHydrated] = useState(false);

    const [collapsedItems, setCollapsedItems] = useState<Record<string, boolean>>(() => {
        if (typeof window === "undefined") return {};
        const stored = localStorage.getItem("collapsedItems");
        return stored ? JSON.parse(stored) : {};
    });
    const [hiddenMap, setHiddenMap] = useState<Record<string, boolean>>(() => {
        if (typeof window === "undefined") return {};
        const stored = localStorage.getItem("hiddenMap");
        return stored ? JSON.parse(stored) : {};
    });

    useEffect(() => {
        setHydrated(true);
    }, []);

    useEffect(() => {
        localStorage.setItem("collapsedItems", JSON.stringify(collapsedItems));
        localStorage.setItem("hiddenMap", JSON.stringify(hiddenMap));
    }, [collapsedItems, hiddenMap]);

    if (!hydrated) return null; // Prevent hydration mismatch

    return (
        <div>
            <aside
                className={`
                bg-gradient-to-b from-slate-800 to-slate-900 border-r border-slate-700
                flex flex-col h-screen fixed left-0 top-0 z-50
                transition-all duration-300 ease-in-out
                ${sidebarCollapsed ? "w-18" : "w-64"}
                shadow-xl
            `}
            >
                {/* Logo */}
                <div className="p-4 border-b border-slate-700 flex items-center justify-between gap-2">
                    {!sidebarCollapsed && (
                        <h2 className="text-white font-bold text-lg">schoolm8</h2>
                    )}
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className={`text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-700 cursor-pointer ${sidebarCollapsed ? "mx-auto" : "ml-auto"}`}
                        title={sidebarCollapsed ? "Expand" : "Collapse"}
                    >
                        {sidebarCollapsed ? (
                            <ChevronRight className="w-5 h-5" />
                        ) : (
                            <ChevronLeft className="w-5 h-5" />
                        )}
                    </button>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 overflow-y-auto p-3 space-y-2">
                    {visibleItems.map((item) => {
                        const IconComponent =
                            (item.icon && ICON_MAP[item.icon]) ||
                            require("lucide-react").LayoutGrid;

                        const active = isActive(item.href);
                        const isCollapsed = collapsedItems[item.id] ?? item.collapsed ?? false;

                        if (item.children && item.children.length > 0) {
                            return (
                                <div key={item.id} className="space-y-1">
                                    <Link
                                        href={item.href}
                                        className={`
                            flex items-center px-3 py-2 rounded-lg transition-all
                            ${
                                active
                                    ? "bg-emerald-500/20 border-l-2 border-l-emerald-500 text-white"
                                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                            }
                            ${sidebarCollapsed ? "" : "gap-3"}
                        `}
                                        title={item.label}
                                    >
                                        <IconComponent
                                            className={`w-5 h-5 flex-shrink-0 ${
                                                sidebarCollapsed ? "mx-auto" : ""
                                            }`}
                                        />

                                        {!sidebarCollapsed && (
                                            <span className="text-sm">{item.label}</span>
                                        )}

                                        {!sidebarCollapsed && item.collapsible && (
                                            <button
                                                className="ml-auto p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();

                                                    setCollapsedItems((prev) => {
                                                        const next = !prev[item.id];

                                                        // unhide immediately when expanding
                                                        if (!next) {
                                                            setHiddenMap((h) => ({
                                                                ...h,
                                                                [item.id]: false,
                                                            }));
                                                        }

                                                        return {
                                                            ...prev,
                                                            [item.id]: next,
                                                        };
                                                    });
                                                }}
                                            >
                                                {isCollapsed ? (
                                                    <ChevronRight className="w-4 h-4" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4" />
                                                )}
                                            </button>
                                        )}
                                    </Link>

                                    {/* Children */}
                                    <div
                                        onTransitionEnd={() => {
                                            if (collapsedItems[item.id]) {
                                                setHiddenMap((prev) => ({
                                                    ...prev,
                                                    [item.id]: true,
                                                }));
                                            }
                                        }}
                                        className={`ml-4 space-y-1 transition-all duration-300 ${
                                            isCollapsed
                                                ? "opacity-0 -translate-y-20 pointer-events-none"
                                                : "opacity-100 translate-y-0"
                                        }`}
                                        style={{
                                            display: hiddenMap[item.id] ? "none" : undefined,
                                        }}
                                    >
                                        {item.children.map((child) => {
                                            const ChildIcon =
                                                (child.icon && ICON_MAP[child.icon]) ||
                                                require("lucide-react").LayoutGrid;

                                            const childActive = isActive(child.href);

                                            return (
                                                <Link
                                                    key={child.id}
                                                    href={child.href}
                                                    className={`
                                        flex items-center px-3 py-2 rounded-lg transition-all cursor-pointer
                                        ${
                                            childActive
                                                ? "bg-emerald-500/20 border-l-2 border-l-emerald-500 text-white"
                                                : "text-slate-300 hover:bg-slate-700 hover:text-white"
                                        }
                                        ${sidebarCollapsed ? "" : "gap-3"}
                                    `}
                                                    title={child.label}
                                                >
                                                    <ChildIcon
                                                        className={`w-5 h-5 flex-shrink-0 ${
                                                            sidebarCollapsed ? "mx-auto" : ""
                                                        }`}
                                                    />
                                                    {!sidebarCollapsed && (
                                                        <span className="text-sm">
                                                            {child.label}
                                                        </span>
                                                    )}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={`
                    flex items-center px-3 py-2 rounded-lg transition-all
                    ${
                        active
                            ? "bg-emerald-500/20 border-l-2 border-l-emerald-500 text-white"
                            : "text-slate-300 hover:bg-slate-700 hover:text-white"
                    }
                    ${sidebarCollapsed ? "" : "gap-3"}
                `}
                                title={item.label}
                            >
                                <IconComponent
                                    className={`w-5 h-5 flex-shrink-0 ${
                                        sidebarCollapsed ? "mx-auto" : ""
                                    }`}
                                />
                                {!sidebarCollapsed && <span className="text-sm">{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Settings Link */}
                <div className="border-t border-slate-700 p-3">
                    <Link
                        href="/settings/navigation"
                        className={`
                        flex items-center gap-3 px-3 py-2 rounded-lg transition-all
                        ${
                            isActive("/settings/navigation")
                                ? "bg-emerald-500/20 border-l-2 border-l-emerald-500 text-white"
                                : "text-slate-300 hover:bg-slate-700 hover:text-white"
                        }
                    `}
                        title="Navigation settings"
                    >
                        <Menu
                            className={`w-5 h-5 flex-shrink-0 ${sidebarCollapsed ? "mx-auto" : ""}`}
                        />
                        {!sidebarCollapsed && <span className="text-sm">Customize</span>}
                    </Link>
                </div>
            </aside>
            <main className={`transition-all duration-300 ${sidebarCollapsed ? "ml-18" : "ml-64"}`}>
                {children}
            </main>
        </div>
    );
};
