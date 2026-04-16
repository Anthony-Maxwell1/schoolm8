"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useAuth } from "./authContext";

export type NavigationItem = {
    id: string;
    label: string;
    href: string;
    icon: string; // lucide icon name
    visible: boolean;
    order: number;
};

export type NavigationLayout = "top" | "sidebar" | "hybrid";

type NavigationContextType = {
    items: NavigationItem[];
    layout: NavigationLayout;
    sidebarCollapsed: boolean;
    setSidebarCollapsed: (collapsed: boolean) => void;
    addItem: (item: NavigationItem) => void;
    removeItem: (id: string) => void;
    updateItem: (id: string, updates: Partial<NavigationItem>) => void;
    reorderItems: (items: NavigationItem[]) => void;
    setLayout: (layout: NavigationLayout) => void;
    saveToDatabase: () => Promise<void>;
    loadFromDatabase: () => Promise<void>;
};

const NavigationContext = createContext<NavigationContextType | null>(null);

const DEFAULT_ITEMS: NavigationItem[] = [
    { id: "home", label: "Home", href: "/", icon: "Home", visible: true, order: 0 },
    {
        id: "dashboard",
        label: "Dashboard",
        href: "/dashboard",
        icon: "LayoutGrid",
        visible: true,
        order: 1,
    },
    {
        id: "timetable",
        label: "Timetable",
        href: "/timetable",
        icon: "Clock",
        visible: true,
        order: 2,
    },
    {
        id: "courses",
        label: "Courses",
        href: "/courses",
        icon: "BookOpen",
        visible: true,
        order: 3,
    },
    { id: "lms", label: "LMS", href: "/lms", icon: "GraduationCap", visible: true, order: 4 },
    {
        id: "assignments",
        label: "Assignments",
        href: "/assignments",
        icon: "FileText",
        visible: true,
        order: 5,
    },
    { id: "notes", label: "Notes", href: "/notes", icon: "StickyNote", visible: true, order: 6 },
    {
        id: "settings",
        label: "Settings",
        href: "/settings",
        icon: "Settings",
        visible: true,
        order: 7,
    },
];

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
    const { user, token } = useAuth();
    const [items, setItems] = useState<NavigationItem[]>(DEFAULT_ITEMS);
    const [layout, setLayout] = useState<NavigationLayout>("hybrid");
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("navigation_config");
        if (saved) {
            try {
                const config = JSON.parse(saved);
                if (config.items) setItems(config.items);
                if (config.layout) setLayout(config.layout);
            } catch (err) {
                console.error("Failed to load navigation config:", err);
            }
        }
    }, []);

    const addItem = (item: NavigationItem) => {
        setItems((prev) => {
            const maxOrder = Math.max(...prev.map((i) => i.order), -1);
            return [...prev, { ...item, order: maxOrder + 1 }];
        });
    };

    const removeItem = (id: string) => {
        setItems((prev) => prev.filter((i) => i.id !== id));
    };

    const updateItem = (id: string, updates: Partial<NavigationItem>) => {
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
    };

    const reorderItems = (newItems: NavigationItem[]) => {
        setItems(newItems);
    };

    const saveToDatabase = async () => {
        // Save to localStorage first
        localStorage.setItem("navigation_config", JSON.stringify({ items, layout }));

        // TODO: Save to Firebase when connected
        if (user && token) {
            try {
                await fetch("/api/user/navigation-config", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ items, layout }),
                });
            } catch (err) {
                console.error("Failed to save navigation config to database:", err);
            }
        }
    };

    const loadFromDatabase = async () => {
        if (user && token) {
            try {
                const res = await fetch("/api/user/navigation-config", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.items) setItems(data.items);
                    if (data.layout) setLayout(data.layout);
                }
            } catch (err) {
                console.error("Failed to load navigation config from database:", err);
            }
        }
    };

    return (
        <NavigationContext.Provider
            value={{
                items: items.sort((a, b) => a.order - b.order),
                layout,
                sidebarCollapsed,
                setSidebarCollapsed,
                addItem,
                removeItem,
                updateItem,
                reorderItems,
                setLayout,
                saveToDatabase,
                loadFromDatabase,
            }}
        >
            {children}
        </NavigationContext.Provider>
    );
};

export const useNavigation = () => {
    const ctx = useContext(NavigationContext);
    if (!ctx) throw new Error("useNavigation must be used inside NavigationProvider");
    return ctx;
};
