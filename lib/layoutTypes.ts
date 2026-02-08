// context/layoutTypes.ts
import { ClassKey } from "@/lib/themeClasses";

export type Anchor = "top" | "left" | "right" | "bottom";

export type Tile = {
    id: string;
    classKey: ClassKey; // connects to themeClasses
    // position as ratios (0-1)
    xStart: number;
    yStart: number;
    xEnd: number;
    yEnd: number;
};

export type Panel = {
    id: string;
    anchor: Anchor;
    size: number; // size as ratio (0-1)
};

export type MainArea = {
    id: string;
    content: React.ReactNode;
};

export type Page = {
    id: string;
    tiles: Tile[];
    panels: Panel[];
    mainArea: MainArea;
};

export type GridSize = { cols: number; rows: number };
