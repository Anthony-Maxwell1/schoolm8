// context/ThemeContext.tsx
import { createContext, useContext, useState, ReactNode } from "react";
import { defaultClasses, ClassMap } from "@/lib/themeClasses";

type ThemeContextType = {
    classes: ClassMap;
    updateClass: (key: keyof ClassMap, value: string) => void;
};

const ThemeContext = createContext<ThemeContextType>({
    classes: defaultClasses,
    updateClass: () => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [classes, setClasses] = useState<ClassMap>(defaultClasses);

    const updateClass = (key: keyof ClassMap, value: string) => {
        setClasses((prev: any) => ({ ...prev, [key]: value }));
    };

    return (
        <ThemeContext.Provider value={{ classes, updateClass }}>{children}</ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
