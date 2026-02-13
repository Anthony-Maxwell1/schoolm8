// utils/themeClasses.ts

export type ClassKey = "Tile" | "TileOuter";

export type Theme = Record<ClassKey, string>;

export type ThemeKey = "basic-minimal" | "retro" | "retro-mac" | "os" | "glass" | "blur";

export type ClassMap = Record<ClassKey, string>;
export type ThemeMap = Record<ThemeKey, Theme>;

export const tw = (classes: string) => classes;

export const themes: ThemeMap = {
    "basic-minimal": {
        TileOuter: tw("p-5"),
        Tile: tw(" h-full w-full rounded-xl border-black border-4 shadow-lg"),
    },
    retro: {
        TileOuter: tw("p-5"),
        Tile: tw(
            "bg-linear-to-br from-yellow-200 to-yellow-400 h-full w-full rounded-xl border-black border-4 shadow-lg",
        ),
    },
    "retro-mac": {
        TileOuter: tw("p-5"),
        Tile: tw(
            "bg-linear-to-br from-gray-300 to-gray-500 h-full w-full rounded-xl border-black border-4 shadow-lg",
        ),
    },
    os: {
        TileOuter: tw("p-5"),
        Tile: tw(
            "bg-linear-to-br from-blue-200 to-blue-400 h-full w-full rounded-xl border-black border-4 shadow-lg",
        ),
    },
    glass: {
        TileOuter: tw("p-5"),
        Tile: tw(
            "bg-white bg-opacity-30 backdrop-blur h-full w-full rounded-xl border-white border-2 shadow-lg",
        ),
    },
    blur: {
        TileOuter: tw("p-5"),
        Tile: tw(
            "bg-white bg-opacity-20 backdrop-blur-lg h-full w-full rounded-xl border-white border-2 shadow-lg",
        ),
    },
};

export const defaultClasses: ClassMap = themes["basic-minimal"];
