// utils/themeClasses.ts
export type ClassKey = "Tile";

export type ClassMap = Record<ClassKey, string>;

export const defaultClasses: ClassMap = {
    Tile: "w-full h-full bg-gray-100 rounded shadow hover:shadow-md transition",
};
