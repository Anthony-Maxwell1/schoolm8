"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

export type NavigationItem = {
    id: string;
    label: string;
    href: string;
    icon?: string;
    children?: NavigationItem[];
    visible: boolean;
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
    { id: "notes", label: "Notes", href: "/notes", icon: "StickyNote", visible: true },
    { id: "settings", label: "Settings", href: "/settings", icon: "Settings", visible: true },
];

export function NavigationProvider({
    children,
    defaultSidebarCollapsed = false,
}: NavigationProviderProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(defaultSidebarCollapsed);

    const value = useMemo(
        () => ({ items, sidebarCollapsed, setSidebarCollapsed }),
        [items, sidebarCollapsed],
    );

    return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigation() {
    const context = useContext(NavigationContext);

    if (!context) {
        throw new Error("useNavigation must be used within a NavigationProvider");
    }

    return context;
}
