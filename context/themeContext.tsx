"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useThemes, Theme, ClassKey } from "@/lib/themeClasses";

type ThemeContextType = {
    themes: Record<string, Theme>;
    currentTheme: string;

    classes: Record<ClassKey, string>;
    topBar: string;
    extraHtml: string;

    setTheme: (themeKey: string) => void;
    setThemes: (themes: Record<string, Theme>) => void;
};

const THEME_KEY_STORAGE = "app-current-theme";

const ThemeContext = createContext<ThemeContextType>({} as any);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const { themes, setThemes } = useThemes();

    /* ---------------- INIT THEME (from localStorage) ---------------- */

    const [currentTheme, setCurrentTheme] = useState<string>(() => {
        if (typeof window === "undefined") return "basic-minimal";
        return localStorage.getItem(THEME_KEY_STORAGE) || "basic-minimal";
    });

    /* ---------------- ACTIVE THEME ---------------- */

    const activeTheme: Theme = themes[currentTheme] || themes[Object.keys(themes)[0]];

    /* ---------------- SET THEME ---------------- */

    const setTheme = (themeKey: string) => {
        if (!themes[themeKey]) return;

        setCurrentTheme(themeKey);

        try {
            localStorage.setItem(THEME_KEY_STORAGE, themeKey);
        } catch {}
    };

    /* ---------------- FALLBACK SAFETY ---------------- */

    useEffect(() => {
        if (!themes[currentTheme]) {
            const fallback = Object.keys(themes)[0];

            if (fallback) {
                setCurrentTheme(fallback);

                try {
                    localStorage.setItem(THEME_KEY_STORAGE, fallback);
                } catch {}
            }
        }
    }, [themes, currentTheme]);

    return (
        <ThemeContext.Provider
            value={{
                themes,
                currentTheme,

                classes: activeTheme.classes,
                topBar: activeTheme.TopBar || "",
                extraHtml: activeTheme.extraHtml || "",

                setTheme,
                setThemes, // full override
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
