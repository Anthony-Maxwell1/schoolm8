"use client";

import { useLayout } from "@/context/layoutContext";
import { TileRegistry, PanelRegistry, RegistryNode } from "@/lib/tiles";
import { Dashboard } from "@/components/Dashboard";
import { useState, useRef, useEffect } from "react";
import { useAccessControl } from "@/lib/access/useAccessControl";
import { useCss } from "@/lib/css";
import { Menu } from "lucide-react";
import Switcher from "@/components/Switcher";
import { Button, TextInput, Card, CardBody, Alert, Modal } from "@/components/ui/components";
import { useRouter } from "next/navigation";

// ─────────────────────────────────────────────────────────────────────────────
// Registry Browser
// ─────────────────────────────────────────────────────────────────────────────

export const RegistryBrowser = ({
    nodes,
    onStartDrag,
    openSection,
    setOpenSection,
}: {
    nodes: RegistryNode[];
    onStartDrag: (node: RegistryNode, initialMouse: { x: number; y: number }) => void;
    openSection: string;
    setOpenSection: (id: string) => void;
}) => (
    <ul className="ml-2 space-y-1">
        {nodes.map((n) => {
            const Component = n.component;
            return (
                <li key={n.id}>
                    {Component ? (
                        <div
                            className="flex cursor-grab items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-2 transition-colors hover:bg-[var(--color-muted)] active:cursor-grabbing"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                onStartDrag(n, { x: e.clientX, y: e.clientY });
                            }}
                        >
                            <Menu
                                size={14}
                                className="shrink-0 text-[var(--color-text-tertiary)]"
                            />
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                                    {n.label}
                                </p>
                                <p className="truncate text-xs text-[var(--color-text-tertiary)]">
                                    {n.id}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <button
                                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-1.5 text-left text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-muted)]"
                                onClick={() => setOpenSection(openSection === n.id ? "" : n.id)}
                            >
                                <span className="flex items-center justify-between">
                                    {n.label}
                                    <span className="text-[var(--color-text-tertiary)]">
                                        {openSection === n.id ? "↑" : "↓"}
                                    </span>
                                </span>
                            </button>
                            {n.children && openSection === n.id && (
                                <RegistryBrowser
                                    nodes={n.children}
                                    onStartDrag={onStartDrag}
                                    openSection={openSection}
                                    setOpenSection={setOpenSection}
                                />
                            )}
                        </div>
                    )}
                </li>
            );
        })}
    </ul>
);

// ─────────────────────────────────────────────────────────────────────────────
// Editor Page
// ─────────────────────────────────────────────────────────────────────────────

export default function EditorPage() {
    const router = useRouter();
    const { allowed, loading: accessLoading } = useAccessControl("dashboard/editor");
    const {
        currentPage,
        gridSize,
        updateTile,
        saveState,
        addPanel,
        addTile,
        addPage,
        pages,
        setCurrentPage,
        setPage,
        deletePage,
    } = useLayout();

    // ── All hooks before early returns ────────────────────────────────────
    const [mounted, setMounted] = useState(false);
    const [draggingNode, setDraggingNode] = useState<RegistryNode | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [dragType, setDragType] = useState<"tile" | "panel" | null>(null);
    const [registryType, setRegistryType] = useState<"tiles" | "panels">("tiles");
    const [openSection, setOpenSection] = useState<string>("");
    const [pageEditorOpen, setPageEditorOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [globalEditorOpen, setGlobalEditorOpen] = useState(false);

    const dashboardRef = useRef<HTMLDivElement>(null);
    const { css } = useCss();
    const style = css.app.dashboard.editor.main;

    const registryTypeOptions = [
        { label: "Tiles", value: "tiles" },
        { label: "Panels", value: "panels" },
    ];

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!draggingNode) return;

        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };

        const handleMouseUp = (e: MouseEvent) => {
            if (!dashboardRef.current) return;

            const rect = dashboardRef.current.getBoundingClientRect();
            const inside =
                e.clientX >= rect.left &&
                e.clientX <= rect.right &&
                e.clientY >= rect.top &&
                e.clientY <= rect.bottom;

            if (inside) {
                const relativeX = e.clientX - rect.left;
                const relativeY = e.clientY - rect.top;
                const col = Math.floor((relativeX / rect.width) * gridSize.cols);
                const row = Math.floor((relativeY / rect.height) * gridSize.rows);

                if (dragType === "tile") {
                    addTile({
                        id: crypto.randomUUID(),
                        registryId: draggingNode.id,
                        x: col,
                        y: row,
                        w: Math.max(1, Math.round(gridSize.cols / 4)),
                        h: Math.max(1, Math.round(gridSize.rows / 4)),
                        props: draggingNode.defaultProps ?? {},
                    });
                    saveState();
                }

                if (dragType === "panel") {
                    const isRight = e.clientX > rect.left + rect.width / 2;
                    const isBottom = e.clientY > rect.top + rect.height / 2;
                    let anchor: "left" | "right" | "top" | "bottom" = "left";
                    if (
                        Math.abs(e.clientX - rect.left - rect.width / 2) >
                        Math.abs(e.clientY - rect.top - rect.height / 2)
                    ) {
                        anchor = isRight ? "right" : "left";
                    } else {
                        anchor = isBottom ? "bottom" : "top";
                    }
                    addPanel({
                        id: crypto.randomUUID(),
                        registryId: draggingNode.id,
                        anchor,
                        size: 0.25,
                        props: draggingNode.defaultProps ?? {},
                    });
                    saveState();
                }
            }

            setDraggingNode(null);
            setDragType(null);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [draggingNode, dragType, gridSize]);

    // ── Early returns (after all hooks) ──────────────────────────────────
    if (accessLoading) return null;
    if (!allowed) return <div>Unauthorized</div>;
    if (!mounted) return null;

    // ── Helpers ───────────────────────────────────────────────────────────
    const startDrag = (node: RegistryNode, type: "tile" | "panel") => {
        setDraggingNode(node);
        setDragType(type);
    };

    let previewStyle: React.CSSProperties | undefined;
    if (draggingNode && dashboardRef.current && dragType === "tile") {
        const rect = dashboardRef.current.getBoundingClientRect();
        const col = Math.floor((mousePos.x - rect.left) / (rect.width / gridSize.cols));
        const row = Math.floor((mousePos.y - rect.top) / (rect.height / gridSize.rows));
        const cellWidth = rect.width / gridSize.cols;
        const cellHeight = rect.height / gridSize.rows;
        previewStyle = {
            position: "absolute",
            left: rect.left / 2 + col * cellWidth,
            top: row * cellHeight,
            width: cellWidth * Math.max(1, Math.round(gridSize.cols / 4)),
            height: cellHeight * Math.max(1, Math.round(gridSize.rows / 4)),
        };
    }

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <div className={style["ROOT-STYLE"]}>
            {/* ── Page Editor Modal ── */}
            <Modal
                open={pageEditorOpen}
                onClose={() => setPageEditorOpen(false)}
                title="Page Editor"
                description="Edit page details and settings"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setPageEditorOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={() => setPageEditorOpen(false)}>Done</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <TextInput
                        label="Page Label"
                        placeholder="Enter page label…"
                        value={currentPage?.label ?? ""}
                        onChange={(e) => setPage(currentPage?.id ?? "", { label: e.target.value })}
                    />
                    <Card variant="flat">
                        <CardBody>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm font-medium text-[var(--color-danger)]">
                                        Delete Page
                                    </p>
                                    <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                                        This action cannot be undone.
                                    </p>
                                </div>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => setDeleteConfirmOpen(true)}
                                >
                                    Delete
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </Modal>

            {/* ── Delete Confirm Modal ── */}
            <Modal
                open={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                title="Delete page?"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            onClick={() => {
                                deletePage(currentPage?.id ?? "");
                                setDeleteConfirmOpen(false);
                                setPageEditorOpen(false);
                            }}
                        >
                            Yes, delete
                        </Button>
                    </>
                }
            >
                <Alert
                    variant="danger"
                    title="This cannot be undone"
                    description="All tiles and panels on this page will be permanently removed."
                />
            </Modal>

            {/* ── Global Editor Modal ── */}
            <Modal
                open={globalEditorOpen}
                onClose={() => setGlobalEditorOpen(false)}
                title="Global Options"
                description="Apply settings to all tiles on this page"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setGlobalEditorOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                const movable = (
                                    document.getElementById("movable") as HTMLInputElement
                                )?.checked;
                                const topBar = (
                                    document.getElementById("topBar") as HTMLInputElement
                                )?.checked;
                                const newSpecialEffects = [
                                    movable ? "movable" : "",
                                    topBar ? "topBar" : "",
                                ].filter(Boolean);
                                for (const tile of currentPage?.tiles ?? []) {
                                    updateTile({
                                        id: tile.id,
                                        registryId: tile.registryId,
                                        x: tile.x,
                                        y: tile.y,
                                        w: tile.w,
                                        h: tile.h,
                                        props: tile.props,
                                        specialEffects: newSpecialEffects,
                                    });
                                }
                                setGlobalEditorOpen(false);
                            }}
                        >
                            Save &amp; Close
                        </Button>
                    </>
                }
            >
                <div className="space-y-3">
                    <label className="flex cursor-pointer items-center gap-3">
                        <input
                            type="checkbox"
                            id="movable"
                            className="h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-primary)]"
                        />
                        <div>
                            <p className="text-sm font-medium text-[var(--color-text-primary)]">
                                Movable
                            </p>
                            <p className="text-xs text-[var(--color-text-secondary)]">
                                Allow tiles to be repositioned
                            </p>
                        </div>
                    </label>
                    <label className="flex cursor-pointer items-center gap-3">
                        <input
                            type="checkbox"
                            id="topBar"
                            className="h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-primary)]"
                        />
                        <div>
                            <p className="text-sm font-medium text-[var(--color-text-primary)]">
                                Top Bar
                            </p>
                            <p className="text-xs text-[var(--color-text-secondary)]">
                                Show a title bar on each tile
                            </p>
                        </div>
                    </label>
                </div>
            </Modal>

            {/* ── Pages sidebar ── */}
            <aside className={style.asideLeft["ROOT-STYLE"]}>
                <Button variant="outline" size="sm" className="w-full" onClick={addPage}>
                    + Page
                </Button>
                <div className="mt-2 space-y-1">
                    {pages.map((p) => (
                        <button
                            key={p.id}
                            className="flex w-full items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-1.5 text-left text-sm text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-muted)]"
                            onClick={() => setCurrentPage(p.id)}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                setCurrentPage(p.id);
                                setPageEditorOpen(true);
                            }}
                        >
                            <span className="truncate">{p.label}</span>
                            <button
                                className="ml-2 shrink-0 rounded p-0.5 text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)]"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentPage(p.id);
                                    setPageEditorOpen(true);
                                }}
                            >
                                <Menu size={14} />
                            </button>
                        </button>
                    ))}
                </div>
            </aside>

            {/* ── Dashboard canvas ── */}
            <main className="relative flex-1" ref={dashboardRef}>
                <Dashboard editable />
            </main>

            {/* ── Registry sidebar ── */}
            <aside className={style.registry["ROOT-STYLE"]}>
                <div className="mb-3">
                    <Switcher
                        options={registryTypeOptions}
                        value={registryType}
                        onChange={setRegistryType as (value: string) => void}
                        className="relative flex w-full flex-row rounded-xl bg-black/30 p-1 backdrop-blur-lg"
                        highlightClassName="w-full flex-1"
                    />
                </div>
                {registryType === "tiles" && (
                    <RegistryBrowser
                        nodes={TileRegistry}
                        onStartDrag={(node, mouse) => {
                            setMousePos(mouse);
                            startDrag(node, "tile");
                        }}
                        openSection={openSection}
                        setOpenSection={setOpenSection}
                    />
                )}
                {registryType === "panels" && (
                    <RegistryBrowser
                        nodes={PanelRegistry}
                        onStartDrag={(node, mouse) => {
                            setMousePos(mouse);
                            startDrag(node, "panel");
                        }}
                        openSection={openSection}
                        setOpenSection={setOpenSection}
                    />
                )}
            </aside>

            {/* ── Drag preview ── */}
            {draggingNode && dragType === "tile" && previewStyle && (
                <div className={style.dragPreview["ROOT-STYLE"]} style={previewStyle}>
                    {draggingNode.label}
                </div>
            )}

            {/* ── Floating actions ── */}
            <div className="fixed bottom-4 right-4 flex flex-col gap-2">
                <Button variant="danger" size="sm" onClick={() => setGlobalEditorOpen(true)}>
                    Global Options
                </Button>
                <Button variant="success" size="sm" onClick={() => router.push("/dashboard")}>
                    ← Dashboard
                </Button>
            </div>
        </div>
    );
}
