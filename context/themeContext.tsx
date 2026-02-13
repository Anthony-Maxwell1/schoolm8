"use client";

// context/ThemeContext.tsx
import { createContext, useContext, useState, ReactNode } from "react";
import { defaultClasses, ClassMap, themes, defaultTopBar } from "@/lib/themeClasses";

type ThemeContextType = {
    classes: ClassMap;
    updateClass: (key: keyof ClassMap, value: string) => void;
    setClasses: (classes: ClassMap) => void;
    topBar: string;
    updateTopBar: (value: string) => void;
    fetchFromTheme: (themeKey: string) => void;
};

const ThemeContext = createContext<ThemeContextType>({
    classes: defaultClasses,
    updateClass: () => {},
    setClasses: () => {},
    topBar: "",
    updateTopBar: () => {},
    fetchFromTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [classes, setClasses] = useState<ClassMap>(defaultClasses);
    const [topBar, setTopBar] = useState<string>(defaultTopBar);

    const updateClass = (key: keyof ClassMap, value: string) => {
        setClasses((prev: any) => ({ ...prev, [key]: value }));
    };

    const updateTopBar = (value: string) => {
        setTopBar(value);
    };

    const fetchFromTheme = (themeKey: string) => {
        const theme = themes[themeKey as keyof typeof themes];
        if (theme) {
            setClasses(theme.classes);
            setTopBar(theme.TopBar || "");
        }
    };

    return (
        <ThemeContext.Provider
            value={{ classes, updateClass, setClasses, topBar, updateTopBar, fetchFromTheme }}
        >
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
