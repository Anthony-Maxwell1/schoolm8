"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { GridSize, Page, TileInstance, PanelInstance } from "@/lib/layoutTypes";

type LayoutContextType = {
    pages: Page[];
    currentPageId: string | null;
    currentPage: Page | null;

    addPage(): void;
    removePage(id: string): void;
    setCurrentPage(id: string): void;

    addTile(tile: TileInstance): void;
    updateTile(tile: TileInstance): void;
    removeTile(id: string): void;

    addPanel(panel: PanelInstance): void;
    removePanel(id: string): void;

    gridSize: GridSize;
};

const LayoutContext = createContext<LayoutContextType | null>(null);

const getGridSize = (): GridSize => {
    if (typeof window === "undefined") return { cols: 20, rows: 10 };
    const w = window.innerWidth;
    if (w > 1200) return { cols: 20, rows: 10 };
    if (w > 800) return { cols: 10, rows: 5 };
    return { cols: 5, rows: 10 };
};

export const LayoutProvider = ({ children }: { children: React.ReactNode }) => {
    // Load initial pages from localStorage
    const [pages, setPages] = useState<Page[]>(() => {
        if (typeof window === "undefined") return [];
        const stored = localStorage.getItem("dashboard_pages");
        return stored ? JSON.parse(stored) : [];
    });

    const [currentPageId, setCurrentPageId] = useState<string | null>(null);
    const [gridSize, setGridSize] = useState<GridSize>(getGridSize());

    useEffect(() => {
        const handler = () => setGridSize(getGridSize());
        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
    }, []);

    const currentPage = useMemo(
        () => pages.find((p) => p.id === currentPageId) ?? null,
        [pages, currentPageId],
    );

    const saveState = () => {
        // Update localStorage whenever pages change
        localStorage.setItem("dashboard_pages", JSON.stringify(pages));
    };

    /* Pages */
    const addPage = () => {
        const id = crypto.randomUUID();
        setPages((p) => [...p, { id, tiles: [], panels: [] }]);
        setCurrentPageId(id);
        saveState();
    };

    const removePage = (id: string) => {
        setPages((p) => p.filter((pg) => pg.id !== id));
        if (currentPageId === id) setCurrentPageId(null);
        saveState();
    };

    /* Tiles */

    const addTile = (tile: TileInstance) => {
        if (!currentPage) return;
        setPages((p) =>
            p.map((pg) => (pg.id === currentPage.id ? { ...pg, tiles: [...pg.tiles, tile] } : pg)),
        );
        saveState();
    };

    const updateTile = (tile: TileInstance) => {
        if (!currentPage) return;
        setPages((p) =>
            p.map((pg) =>
                pg.id === currentPage.id
                    ? {
                          ...pg,
                          tiles: pg.tiles.map((t) => (t.id === tile.id ? tile : t)),
                      }
                    : pg,
            ),
        );
        saveState();
    };

    const removeTile = (id: string) => {
        if (!currentPage) return;
        setPages((p) =>
            p.map((pg) =>
                pg.id === currentPage.id
                    ? {
                          ...pg,
                          tiles: pg.tiles.filter((t) => t.id !== id),
                      }
                    : pg,
            ),
        );
        saveState();
    };

    /* Panels */

    const addPanel = (panel: PanelInstance) => {
        if (!currentPage) return;
        setPages((p) =>
            p.map((pg) => {
                if (pg.id !== currentPage.id) return pg;
                if (pg.panels.some((pn) => pn.id === panel.id)) return pg;
                return { ...pg, panels: [...pg.panels, panel] };
            }),
        );
        saveState();
    };

    const removePanel = (id: string) => {
        if (!currentPage) return;
        setPages((p) =>
            p.map((pg) =>
                pg.id === currentPage.id
                    ? {
                          ...pg,
                          panels: pg.panels.filter((pn) => pn.id !== id),
                      }
                    : pg,
            ),
        );
        saveState();
    };

    return (
        <LayoutContext.Provider
            value={{
                pages,
                currentPageId,
                currentPage,
                addPage,
                removePage,
                setCurrentPage: setCurrentPageId,
                addTile,
                updateTile,
                removeTile,
                addPanel,
                removePanel,
                gridSize,
            }}
        >
            {children}
        </LayoutContext.Provider>
    );
};

export const useLayout = () => {
    const ctx = useContext(LayoutContext);
    if (!ctx) throw new Error("useLayout must be used inside LayoutProvider");
    return ctx;
};
