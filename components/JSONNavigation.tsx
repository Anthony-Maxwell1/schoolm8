import { useEffect, useRef, useState } from "react";
import { useCss } from "@/lib/css";

export type Node = {
    name: string;
    id: string;
    hasData: boolean;
    children?: Node[];
};

function Panel({
    nodes,
    layer,
    selectedId,
    onSelect,
}: {
    nodes: Node[];
    layer: number;
    selectedId?: string;
    onSelect: (node: Node, layer: number) => void;
}) {
    const { css } = useCss();
    const style = css.components.JSONNavigation.main;

    return (
        <div className={style.panel["ROOT-STYLE"]}>
            {nodes.map((node) => {
                const isSelected = selectedId === node.id;
                return (
                    <div
                        key={node.id}
                        onClick={() => onSelect(node, layer)}
                        className={[
                            style.item["ROOT-STYLE"],
                            isSelected ? style.item["selected-style"] : "",
                        ].join(" ")}
                    >
                        <span className={style.item.text["ROOT-STYLE"]}>{node.name}</span>
                        {node.children?.length ? (
                            <span className={style.item.arrow["ROOT-STYLE"]}>
                                {style.item.arrow.CONTENT}
                            </span>
                        ) : null}
                    </div>
                );
            })}
        </div>
    );
}

export default function JSONNavigator({
    nodes,
    title,
    DataComponent,
}: {
    nodes: Node[];
    title?: string;
    DataComponent?: React.ComponentType<{ path: string[] }>;
}) {
    const { css } = useCss();
    const style = css.components.JSONNavigation;
    const [panels, setPanels] = useState<string[]>([]);
    const [selectedPath, setSelectedPath] = useState<string[]>([]);
    const columnsRef = useRef<HTMLDivElement>(null);
    const [data, setData] = useState<string[] | null>(null);
    let currentNodes = nodes;

    useEffect(() => {
        const el = columnsRef.current;
        if (!el) return;

        el.scrollTo({
            left: el.scrollWidth,
            behavior: "smooth",
        });
    }, [panels]);

    const handleSelect = (node: Node, layer: number) => {
        const nextPath = [...selectedPath.slice(0, layer), node.id];
        setSelectedPath(nextPath);

        if (node.children?.length) {
            setPanels((prev) => [...prev.slice(0, layer), node.id]);
        } else {
            setPanels((prev) => prev.slice(0, layer));
        }

        setData(node.hasData ? nextPath : null);
    };

    return (
        <div className={style.main["ROOT-STYLE"]}>
            <div className={style.main.header["ROOT-STYLE"]}>
                {title || style.main.header.CONTENT}
            </div>

            <div ref={columnsRef} className={style.main.columns["ROOT-STYLE"]}>
                <Panel
                    nodes={nodes}
                    layer={0}
                    selectedId={selectedPath[0]}
                    onSelect={handleSelect}
                />
                {panels.map((panelId, index) => {
                    const node = currentNodes.find((n) => n.id === panelId);
                    if (!node) return null;

                    currentNodes = node.children || [];

                    return (
                        <Panel
                            key={`${panelId}-${index}`}
                            nodes={currentNodes}
                            layer={index + 1}
                            selectedId={selectedPath[index + 1]}
                            onSelect={handleSelect}
                        />
                    );
                })}
                {data && DataComponent && <DataComponent path={data} />}
            </div>
        </div>
    );
}
