// context/LayoutContext.tsx
import { createContext, useContext, useState, ReactNode } from "react";
import { Page, Tile, Panel, MainArea, GridSize } from "@/lib/layoutTypes";

type LayoutContextType = {
    pages: Page[];
    currentPage: Page | null;
    setCurrentPage: (id: string) => void;
    addTile: (tile: Tile) => void;
    updateTile: (tile: Tile) => void;
    addPanel: (panel: Panel) => void;
    gridSize: GridSize;
    createPage: (id: string, tiles?: Tile[], panels?: Panel[], mainArea?: MainArea) => void; // <-- add this
};

const LayoutContext = createContext<LayoutContextType>({
    pages: [],
    currentPage: null,
    setCurrentPage: () => {},
    addTile: () => {},
    updateTile: () => {},
    addPanel: () => {},
    gridSize: { cols: 20, rows: 10 },
    createPage: () => {}, // <-- must exist
});

export const LayoutProvider = ({ children }: { children: ReactNode }) => {
    const [pages, setPages] = useState<Page[]>([]);
    const [currentPageId, setCurrentPageId] = useState<string | null>(null);

    const currentPage = pages.find((p) => p.id === currentPageId) || null;

    const setCurrentPage = (id: string) => setCurrentPageId(id);

    const addTile = (tile: Tile) => {
        if (!currentPage) return;
        setPages((prev) =>
            prev.map((p) => (p.id === currentPage.id ? { ...p, tiles: [...p.tiles, tile] } : p)),
        );
    };

    const updateTile = (tile: Tile) => {
        if (!currentPage) return;
        setPages((prev) =>
            prev.map((p) =>
                p.id === currentPage.id
                    ? {
                          ...p,
                          tiles: p.tiles.map((t) => (t.id === tile.id ? tile : t)),
                      }
                    : p,
            ),
        );
    };

    const addPanel = (panel: Panel) => {
        if (!currentPage) return;
        setPages((prev) =>
            prev.map((p) => (p.id === currentPage.id ? { ...p, panels: [...p.panels, panel] } : p)),
        );
    };

    const createPage = (
        id: string,
        tiles: Tile[] = [],
        panels: Panel[] = [],
        mainArea: MainArea = { id: "main", content: null },
    ) => {
        const page: Page = { id, tiles, panels, mainArea };
        setPages((prev) => [...prev, page]);
        setCurrentPageId(id);
    };

    const getGridSize = (): GridSize => {
        if (typeof window === "undefined") return { cols: 20, rows: 10 };
        const width = window.innerWidth;
        if (width > 1200) return { cols: 20, rows: 10 };
        if (width > 800) return { cols: 10, rows: 5 };
        return { cols: 5, rows: 10 };
    };

    const [gridSize, setGridSize] = useState<GridSize>(getGridSize());

    if (typeof window !== "undefined") {
        window.onresize = () => setGridSize(getGridSize());
    }

    return (
        <LayoutContext.Provider
            value={{
                pages,
                currentPage,
                setCurrentPage,
                addTile,
                updateTile,
                addPanel,
                gridSize,
                createPage, // <-- now TS knows this exists
            }}
        >
            {children}
        </LayoutContext.Provider>
    );
};

export const useLayout = () => useContext(LayoutContext);
