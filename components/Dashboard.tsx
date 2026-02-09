"use client";

import { useLayout } from "@/context/layoutContext";
import { TileRegistry, PanelRegistry } from "@/lib/tiles";
import { RegistryNode } from "@/lib/tiles";

const findRegistry = (id: string, nodes: RegistryNode[]): RegistryNode | null => {
    for (const n of nodes) {
        if (n.id === id) return n;
        if (n.children) {
            const found = findRegistry(id, n.children);
            if (found) return found;
        }
    }
    return null;
};

export const Dashboard = ({ editable = false }: { editable?: boolean }) => {
    const { currentPage, gridSize, updateTile, removeTile } = useLayout();

    if (!currentPage) return <div className="p-4">No page selected</div>;

    return (
        <div className="relative w-full h-full bg-gray-100">
            {/* Panels */}
            {currentPage.panels.map(panel => {
                const def = findRegistry(panel.registryId, PanelRegistry);
                if (!def?.component) return null;
                const PanelComponent = def.component;

                const style: React.CSSProperties = {
                    position: "absolute",
                };

                if (panel.anchor === "left" || panel.anchor === "right") {
                    style.width = `${panel.size * 100}%`;
                    style.height = "100%";
                    style[panel.anchor] = 0;
                } else {
                    style.height = `${panel.size * 100}%`;
                    style.width = "100%";
                    style[panel.anchor] = 0;
                }

                return (
                    <div key={panel.id} style={style}>
                        <PanelComponent {...panel.props} />
                    </div>
                );
            })}

            {/* Tiles */}
            {currentPage.tiles.map(tile => {
                const def = findRegistry(tile.registryId, TileRegistry);
                if (!def?.component) return null;
                const TileComponent = def.component;

                const style: React.CSSProperties = {
                    position: "absolute",
                    left: `${(tile.x / gridSize.cols) * 100}%`,
                    top: `${(tile.y / gridSize.rows) * 100}%`,
                    width: `${(tile.w / gridSize.cols) * 100}%`,
                    height: `${(tile.h / gridSize.rows) * 100}%`,
                };

                return (
                    <div
                        key={tile.id}
                        style={style}
                        className="border bg-white shadow"
                    >
                        {editable && (
                            <button
                                className="absolute top-0 right-0 text-xs"
                                onClick={() => removeTile(tile.id)}
                            >
                                ✕
                            </button>
                        )}
                        <TileComponent {...tile.props} />
                    </div>
                );
            })}
        </div>
    );
};
