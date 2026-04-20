"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type NavigationItem = {
    id: string;
    label: string;
    href: string;
    icon?: string;
    children?: NavigationItem[];
    visible: boolean;
    collapsible?: boolean;
    collapsed?: boolean;
};

type NavigationContextValue = {
    items: NavigationItem[];
    sidebarCollapsed: boolean;
    setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
};

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined);

type NavigationProviderProps = {
    children: React.ReactNode;
    defaultSidebarCollapsed?: boolean;
};

const items: NavigationItem[] = [
    { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: "LayoutGrid", visible: true },
    { id: "editor", label: "Editor", href: "/dashboard/editor", icon: "Edit", visible: true },
    {
        id: "notes",
        label: "Notes",
        href: "/notes",
        icon: "StickyNote",
        visible: true,
        collapsible: true,
        children: [
            {
                id: "create-note",
                label: "Create Note",
                href: "/notes/create",
                icon: "FileText",
                visible: true,
            },
        ],
    },
    {
        id: "settings",
        label: "Settings",
        href: "/settings",
        icon: "Settings",
        visible: true,
        collapsible: true,
        children: [
            {
                id: "integrations",
                label: "Integrations",
                href: "/settings/integrations",
                icon: "Link",
                visible: true,
            },
            {
                id: "appearance",
                label: "Themes & Styles",
                href: "/settings/appearance",
                icon: "Brush",
                visible: true,
            },
            {
                id: "advanced",
                label: "Advanced",
                href: "/settings/advanced",
                icon: "SlidersHorizontal",
                visible: true,
            },
            {
                id: "account",
                label: "Account",
                href: "/settings/account",
                icon: "User",
                visible: true,
            },
            {
                id: "tasks",
                label: "Tasks/Jobs",
                href: "/settings/tasks",
                icon: "List",
                visible: true,
            },
        ],
    },
];

export function NavigationProvider({
    children,
    defaultSidebarCollapsed = false,
}: NavigationProviderProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        if (typeof window === "undefined") return defaultSidebarCollapsed;
        const stored = localStorage.getItem("sidebarCollapsed");
        return stored ? JSON.parse(stored) : defaultSidebarCollapsed;
    });

    const value = useMemo(
        () => ({ items, sidebarCollapsed, setSidebarCollapsed }),
        [items, sidebarCollapsed],
    );

    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("sidebarCollapsed", JSON.stringify(sidebarCollapsed));
        }
    }, [sidebarCollapsed]);

    return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigation() {
    const context = useContext(NavigationContext);

    if (!context) {
        throw new Error("useNavigation must be used within a NavigationProvider");
    }

    return context;
}
