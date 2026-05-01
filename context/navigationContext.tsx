"use client";

import React, {
    ComponentType,
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

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
    setItems: React.Dispatch<React.SetStateAction<NavigationItem[]>>;
    sidebarCollapsed: boolean;
    setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
    ICON_MAP: Record<string, ComponentType<{ className?: string }>>;
    DEFAULT_ITEMS: NavigationItem[];
};

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined);

type NavigationProviderProps = {
    children: React.ReactNode;
    defaultSidebarCollapsed?: boolean;
};

const DEFAULT_ITEMS: NavigationItem[] = [
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

const ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
    Home: require("lucide-react").Home,
    LayoutGrid: require("lucide-react").LayoutGrid,
    Clock: require("lucide-react").Clock,
    BookOpen: require("lucide-react").BookOpen,
    GraduationCap: require("lucide-react").GraduationCap,
    FileText: require("lucide-react").FileText,
    StickyNote: require("lucide-react").StickyNote,
    Settings: require("lucide-react").Settings,
    Edit: require("lucide-react").Pencil,
    Link: require("lucide-react").Link,
    Brush: require("lucide-react").Brush,
    SlidersHorizontal: require("lucide-react").SlidersHorizontal,
    User: require("lucide-react").User,
    List: require("lucide-react").ListChecks,
};

const ITEMS_STORAGE_KEY = "navigationItems";
const SIDEBAR_STORAGE_KEY = "sidebarCollapsed";

export function NavigationProvider({
    children,
    defaultSidebarCollapsed = false,
}: NavigationProviderProps) {
    const [items, setItems] = useState<NavigationItem[]>(() => {
        if (typeof window === "undefined") return DEFAULT_ITEMS;

        try {
            const stored = localStorage.getItem(ITEMS_STORAGE_KEY);
            return stored ? (JSON.parse(stored) as NavigationItem[]) : DEFAULT_ITEMS;
        } catch {
            return DEFAULT_ITEMS;
        }
    });

    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        if (typeof window === "undefined") return defaultSidebarCollapsed;

        try {
            const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
            return stored ? (JSON.parse(stored) as boolean) : defaultSidebarCollapsed;
        } catch {
            return defaultSidebarCollapsed;
        }
    });

    const value = useMemo(
        () => ({ items, setItems, sidebarCollapsed, setSidebarCollapsed, ICON_MAP, DEFAULT_ITEMS }),
        [items, sidebarCollapsed],
    );

    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(items));
        }
    }, [items]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(sidebarCollapsed));
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
