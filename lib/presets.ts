/**
 * Presets for schoolm8
 *
 * This file contains predefined configurations for:
 * - Dashboard Layouts
 * - Themes
 * - Navigation Structures
 *
 * Presets can be selected during onboarding or in settings, and users can
 * create custom presets based on existing ones.
 */

import { NavigationItem, NavigationLayout } from "@/context/navigationContext";
import { ThemeKey } from "@/lib/themeClasses";

/* =====================================================
   LAYOUT PRESETS
===================================================== */

export interface LayoutPreset {
    id: string;
    name: string;
    description: string;
    gridSize: { cols: number; rows: number };
    requiredServices: string[]; // e.g., ["canvas", "edumate"]
    defaultTiles: Array<{
        registryId: string;
        x: number;
        y: number;
        w: number;
        h: number;
        props: Record<string, any>;
    }>;
}

export const layoutPresets: Record<string, LayoutPreset> = {
    minimal: {
        id: "minimal",
        name: "Minimal",
        description: "A clean, simple dashboard with just the essentials",
        gridSize: { cols: 10, rows: 5 },
        requiredServices: [],
        defaultTiles: [
            {
                registryId: "ClockTile",
                x: 0,
                y: 0,
                w: 3,
                h: 2,
                props: {},
            },
            {
                registryId: "WeatherTile",
                x: 3,
                y: 0,
                w: 3,
                h: 2,
                props: {},
            },
            {
                registryId: "Timetable",
                x: 0,
                y: 2,
                w: 10,
                h: 3,
                props: {},
            },
        ],
    },

    student: {
        id: "student",
        name: "Student",
        description: "Optimized for students with LMS and timetable",
        gridSize: { cols: 12, rows: 8 },
        requiredServices: ["lms", "timetable"],
        defaultTiles: [
            {
                registryId: "ClockTile",
                x: 0,
                y: 0,
                w: 4,
                h: 2,
                props: {},
            },
            {
                registryId: "WeatherTile",
                x: 4,
                y: 0,
                w: 4,
                h: 2,
                props: {},
            },
            {
                registryId: "Timetable",
                x: 0,
                y: 2,
                w: 6,
                h: 3,
                props: { view: "today" },
            },
            {
                registryId: "Assignments",
                x: 6,
                y: 2,
                w: 6,
                h: 3,
                props: { limit: 5 },
            },
            {
                registryId: "Announcements",
                x: 0,
                y: 5,
                w: 12,
                h: 3,
                props: { limit: 3 },
            },
        ],
    },

    advanced: {
        id: "advanced",
        name: "Advanced",
        description: "Feature-rich dashboard with multiple widgets and sections",
        gridSize: { cols: 20, rows: 10 },
        requiredServices: ["lms", "timetable"],
        defaultTiles: [
            {
                registryId: "ClockTile",
                x: 0,
                y: 0,
                w: 4,
                h: 2,
                props: {},
            },
            {
                registryId: "WeatherTile",
                x: 4,
                y: 0,
                w: 4,
                h: 2,
                props: {},
            },
            {
                registryId: "Timetable",
                x: 0,
                y: 2,
                w: 10,
                h: 4,
                props: { view: "week" },
            },
            {
                registryId: "Assignments",
                x: 10,
                y: 2,
                w: 10,
                h: 4,
                props: { limit: 10, sort: "dueDate" },
            },
            {
                registryId: "Announcements",
                x: 0,
                y: 6,
                w: 20,
                h: 4,
                props: { limit: 5 },
            },
        ],
    },

    compact: {
        id: "compact",
        name: "Compact",
        description: "Space-efficient layout for smaller screens",
        gridSize: { cols: 6, rows: 8 },
        requiredServices: [],
        defaultTiles: [
            {
                registryId: "ClockTile",
                x: 0,
                y: 0,
                w: 3,
                h: 2,
                props: {},
            },
            {
                registryId: "Timetable",
                x: 0,
                y: 2,
                w: 6,
                h: 3,
                props: { view: "today" },
            },
            {
                registryId: "Announcements",
                x: 0,
                y: 5,
                w: 6,
                h: 3,
                props: { limit: 3 },
            },
        ],
    },
};

/* =====================================================
   THEME PRESETS
===================================================== */

export interface ThemePreset {
    id: string;
    name: string;
    description: string;
    themeKey: ThemeKey;
    accentColor: string; // Tailwind color for accents
}

export const themePresets: Record<string, ThemePreset> = {
    "blur-default": {
        id: "blur-default",
        name: "Blur (Default)",
        description: "Modern frosted glass effect",
        themeKey: "blur",
        accentColor: "emerald",
    },

    "light-clean": {
        id: "light-clean",
        name: "Light (Clean)",
        description: "Bright and clean light theme",
        themeKey: "light",
        accentColor: "blue",
    },

    "dark-deep": {
        id: "dark-deep",
        name: "Dark (Deep)",
        description: "Deep dark theme for low-light environments",
        themeKey: "dark",
        accentColor: "cyan",
    },

    "retro-classic": {
        id: "retro-classic",
        name: "Retro (Classic)",
        description: "Windows 98 inspired classic theme",
        themeKey: "blur", // fallback, uses custom CSS
        accentColor: "slate",
    },

    "glass-modern": {
        id: "glass-modern",
        name: "Glass (Modern)",
        description: "Glassmorphism modern theme",
        themeKey: "blur", // uses custom CSS
        accentColor: "blue",
    },

    "community-stub": {
        id: "community-stub",
        name: "Community (Stub)",
        description: "Community-created theme (placeholder)",
        themeKey: "community",
        accentColor: "purple",
    },
};

/* =====================================================
   NAVIGATION PRESETS
===================================================== */

export interface NavigationPreset {
    id: string;
    name: string;
    description: string;
    layout: NavigationLayout;
    items: NavigationItem[];
}

export const navigationPresets: Record<string, NavigationPreset> = {
    standard: {
        id: "standard",
        name: "Standard",
        description: "Top bar with sidebar navigation",
        layout: "hybrid",
        items: [
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
            {
                id: "lms",
                label: "LMS",
                href: "/lms",
                icon: "GraduationCap",
                visible: true,
                order: 4,
            },
            {
                id: "assignments",
                label: "Assignments",
                href: "/assignments",
                icon: "FileText",
                visible: true,
                order: 5,
            },
            {
                id: "notes",
                label: "Notes",
                href: "/notes",
                icon: "StickyNote",
                visible: true,
                order: 6,
            },
            {
                id: "settings",
                label: "Settings",
                href: "/settings",
                icon: "Settings",
                visible: true,
                order: 7,
            },
        ],
    },

    minimal: {
        id: "minimal",
        name: "Minimal",
        description: "Top bar only, no sidebar",
        layout: "top",
        items: [
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
            {
                id: "settings",
                label: "Settings",
                href: "/settings",
                icon: "Settings",
                visible: true,
                order: 4,
            },
        ],
    },

    sidebar: {
        id: "sidebar",
        name: "Sidebar",
        description: "Collapsible sidebar only",
        layout: "sidebar",
        items: [
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
            {
                id: "lms",
                label: "LMS",
                href: "/lms",
                icon: "GraduationCap",
                visible: true,
                order: 4,
            },
            {
                id: "assignments",
                label: "Assignments",
                href: "/assignments",
                icon: "FileText",
                visible: true,
                order: 5,
            },
            {
                id: "notes",
                label: "Notes",
                href: "/notes",
                icon: "StickyNote",
                visible: true,
                order: 6,
            },
            {
                id: "settings",
                label: "Settings",
                href: "/settings",
                icon: "Settings",
                visible: true,
                order: 7,
            },
        ],
    },

    custom: {
        id: "custom",
        name: "Custom",
        description: "User-customized navigation",
        layout: "hybrid",
        items: [
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
            {
                id: "settings",
                label: "Settings",
                href: "/settings",
                icon: "Settings",
                visible: true,
                order: 4,
            },
        ],
    },
};

/* =====================================================
   COMBINED PRESETS (For Onboarding)
===================================================== */

export interface OnboardingPreset {
    id: string;
    name: string;
    description: string;
    layout: LayoutPreset;
    dashboardTheme: ThemePreset;
    websiteTheme: ThemePreset;
    navigation: NavigationPreset;
}

export const onboardingPresets: Record<string, OnboardingPreset> = {
    quickStart: {
        id: "quickStart",
        name: "Quick Start",
        description: "Get started quickly with default settings",
        layout: layoutPresets.minimal,
        dashboardTheme: themePresets["blur-default"],
        websiteTheme: themePresets["blur-default"],
        navigation: navigationPresets.standard,
    },

    studentPro: {
        id: "studentPro",
        name: "Student Pro",
        description: "Optimized for students",
        layout: layoutPresets.student,
        dashboardTheme: themePresets["dark-deep"],
        websiteTheme: themePresets["blur-default"],
        navigation: navigationPresets.standard,
    },

    powerUser: {
        id: "powerUser",
        name: "Power User",
        description: "Advanced setup for power users",
        layout: layoutPresets.advanced,
        dashboardTheme: themePresets["dark-deep"],
        websiteTheme: themePresets["light-clean"],
        navigation: navigationPresets.sidebar,
    },

    minimal: {
        id: "minimal",
        name: "Minimal",
        description: "Clean and simple setup",
        layout: layoutPresets.minimal,
        dashboardTheme: themePresets["light-clean"],
        websiteTheme: themePresets["light-clean"],
        navigation: navigationPresets.minimal,
    },
};

/* =====================================================
   HELPER FUNCTIONS
===================================================== */

/**
 * Get a layout preset by ID
 */
export function getLayoutPreset(id: string): LayoutPreset | null {
    return layoutPresets[id] || null;
}

/**
 * Get a theme preset by ID
 */
export function getThemePreset(id: string): ThemePreset | null {
    return themePresets[id] || null;
}

/**
 * Get a navigation preset by ID
 */
export function getNavigationPreset(id: string): NavigationPreset | null {
    return navigationPresets[id] || null;
}

/**
 * Get an onboarding preset by ID
 */
export function getOnboardingPreset(id: string): OnboardingPreset | null {
    return onboardingPresets[id] || null;
}

/**
 * Get all available presets organized by type
 */
export function getAllPresets() {
    return {
        layouts: Object.values(layoutPresets),
        themes: Object.values(themePresets),
        navigations: Object.values(navigationPresets),
        onboarding: Object.values(onboardingPresets),
    };
}

/**
 * Filter layout presets by required services
 */
export function getLayoutPresetsForServices(requiredServices: string[]) {
    return Object.values(layoutPresets).filter((preset) => {
        if (preset.requiredServices.length === 0) return true;
        return preset.requiredServices.every((service) => requiredServices.includes(service));
    });
}
