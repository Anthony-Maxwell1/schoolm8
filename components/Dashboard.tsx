// components/Dashboard.tsx
import { useLayout } from "../context/layoutContext";
import { useTheme } from "../context/themeContext";

export const Dashboard = () => {
    const { currentPage, gridSize } = useLayout();
    const { classes } = useTheme();

    if (!currentPage) return <div>No page selected</div>;

    return (
        <div className="relative w-full h-full">
            {currentPage.panels.map((panel) => {
                const style: React.CSSProperties = {};
                if (panel.anchor === "left" || panel.anchor === "right") {
                    style.width = `${panel.size * 100}%`;
                    style.height = "100%";
                    style[panel.anchor] = 0;
                } else {
                    style.height = `${panel.size * 100}%`;
                    style.width = "100%";
                    style[panel.anchor] = 0;
                }
                return <div key={panel.id} className="absolute bg-gray-200" style={style}></div>;
            })}

            {currentPage.tiles.map((tile) => {
                const { xStart, yStart, xEnd, yEnd } = tile;
                const style: React.CSSProperties = {
                    position: "absolute",
                    left: `${(xStart / (gridSize.cols - 1)) * 100}%`,
                    top: `${(yStart / (gridSize.rows - 1)) * 100}%`,
                    width: `${((xEnd - xStart + 1) / gridSize.cols) * 100}%`,
                    height: `${((yEnd - yStart + 1) / gridSize.rows) * 100}%`,
                };
                return (
                    <div key={tile.id} className={classes.Tile} style={style}>
                        {tile.id}
                    </div>
                );
            })}
        </div>
    );
};
