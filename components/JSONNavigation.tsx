import { useEffect, useRef, useState } from "react";

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
    return (
        <div className="min-w-65 border-r border-zinc-200 bg-white p-1.5">
            {nodes.map((node) => {
                const isSelected = selectedId === node.id;
                return (
                    <div
                        key={node.id}
                        onClick={() => onSelect(node, layer)}
                        className={[
                            "flex h-7.5 cursor-default select-none items-center justify-between rounded-md px-2.5 text-[13px]",
                            isSelected ? "bg-blue-500 text-white" : "text-zinc-900",
                        ].join(" ")}
                    >
                        <span className="mr-2 overflow-hidden text-ellipsis whitespace-nowrap">
                            {node.name}
                        </span>
                        {node.children?.length ? (
                            <span className="text-base leading-none opacity-70">›</span>
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
        <div className="overflow-hidden rounded-[10px] border border-zinc-300 bg-zinc-100 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
            <div className="flex h-10 items-center border-b border-zinc-300 bg-linear-to-b from-zinc-50 to-zinc-200 px-3.5 text-[13px] font-semibold text-zinc-700">
                {title || "JSON Navigator"}
            </div>

            <div ref={columnsRef} className="flex min-h-105 overflow-x-auto bg-white">
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
