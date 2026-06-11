"use client";

import { useState, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { EditorView } from "@codemirror/view";
import { useCss } from "@/lib/css";
import { useTheme } from "@/context/themeContext";
import * as prettier from "prettier";
import prettierPluginBabel from "prettier/plugins/babel";
import prettierPluginEstree from "prettier/plugins/estree";
import Link from "next/link";
import JSONNavigator from "@/components/JSONNavigation";
import { Node } from "@/components/JSONNavigation";
import { TailwindEditor } from "@/components/TailwindEditor";
import { parseTree, findNodeAtLocation } from "jsonc-parser";
import { atomone } from "@uiw/codemirror-theme-atomone";
import { html } from "@codemirror/lang-html";
import Image from "next/image";
import { Book } from "lucide-react";
import { useAccessControl } from "@/lib/access/useAccessControl";
import { builtin } from "@/lib/themeClasses";
import {
    Button,
    Text,
    Alert,
    Badge,
    Tabs,
    TabList,
    Tab,
    TabPanel,
} from "@/components/ui/components";
import Switcher from "@/components/Switcher";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers (unchanged from original)
// ─────────────────────────────────────────────────────────────────────────────

function getJsonPathRange(json: string, path: (string | number)[]) {
    const tree = parseTree(json);
    if (!tree) return null;
    const node = findNodeAtLocation(tree, path);
    if (!node) return null;
    return { start: node.offset, end: node.offset + node.length };
}

// ─────────────────────────────────────────────────────────────────────────────
// Theme card — shared by dashboard, website, tile sections
// ─────────────────────────────────────────────────────────────────────────────

function ThemeCard({
    themeKey,
    imageUrl,
    active,
    onActivate,
    onDuplicate,
    onDelete,
    isBuiltin,
    type,
}: {
    themeKey: string;
    imageUrl?: string;
    active: boolean;
    onActivate: () => void;
    onDuplicate?: () => void;
    onDelete?: () => void;
    isBuiltin?: boolean;
    type: "dashboard" | "website" | "tile";
}) {
    return (
        <div
            className={[
                "group relative overflow-hidden rounded-[var(--radius-xl)] border bg-white/95 shadow-[var(--shadow-md)] transition-[transform,shadow] duration-[var(--duration-base)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)] cursor-pointer",
                active
                    ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/30"
                    : "border-[var(--color-border)]",
            ].join(" ")}
            onClick={onActivate}
        >
            {/* Preview */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-slate-100 via-white to-slate-200">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={themeKey}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-700 via-slate-600 to-slate-900 text-white">
                        <div className="text-center px-4">
                            <div className="text-xs uppercase tracking-[0.35em] text-white/60">
                                No preview
                            </div>
                            <div className="mt-1.5 text-base font-medium capitalize">{themeKey}</div>
                        </div>
                    </div>
                )}

                {/* Overlay caption */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3">
                    {!isBuiltin && (
                        <button
                            className="mb-2 rounded-[var(--radius-sm)] bg-[var(--color-danger)] px-2 py-0.5 text-xs text-white transition hover:opacity-90"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete?.();
                            }}
                        >
                            Uninstall
                        </button>
                    )}
                    <div className="text-[10px] uppercase tracking-[0.3em] text-white/60">
                        {type}
                    </div>
                    <div className="text-sm font-medium capitalize text-white">{themeKey}</div>
                </div>

                {active && (
                    <div className="absolute right-2 top-2">
                        <Badge variant="success" pill>Active</Badge>
                    </div>
                )}
            </div>

            {/* Actions (website / tile only) */}
            {(onDuplicate || onDelete) && type !== "dashboard" && (
                <div className="flex gap-2 px-3 py-2.5 border-t border-slate-200/60">
                    {onDuplicate && (
                        <button
                            type="button"
                            className="rounded-[var(--radius-sm)] bg-slate-800 px-2 py-1 text-xs text-white transition hover:bg-slate-700"
                            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
                        >
                            Duplicate
                        </button>
                    )}
                    {onDelete && (
                        <button
                            type="button"
                            className="rounded-[var(--radius-sm)] bg-[var(--color-danger)] px-2 py-1 text-xs text-white transition hover:opacity-90"
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        >
                            Delete
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

function CreateThemeCard({ label, onClick }: { label: string; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="group relative overflow-hidden rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border)] bg-[var(--color-muted)] text-left shadow-[var(--shadow-sm)] transition-[transform,shadow] duration-[var(--duration-base)] hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-raised)] hover:shadow-[var(--shadow-md)] min-h-[120px] flex flex-col items-start justify-end p-4"
        >
            <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-text-tertiary)]">Create</div>
            <div className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">{label}</div>
        </button>
    );
}

function BrowseThemeCard({ href, label }: { href: string; label: string }) {
    return (
        <Link
            href={href}
            className="group relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-md)] transition-[transform,shadow] duration-[var(--duration-base)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)] min-h-[120px] block"
        >
            <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-slate-100 via-white to-slate-200">
                <Image
                    src="https://picsum.photos/600/400"
                    alt={label}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3 text-white">
                    <div className="text-sm font-medium">{label}</div>
                </div>
            </div>
        </Link>
    );
}

function SectionHeading({ title, description }: { title: string; description: string }) {
    return (
        <div className="mb-4">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-normal text-[var(--color-text-primary)]">
                {title}
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{description}</p>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function AppearanceSettings() {
    const { allowed, loading: accessLoading } = useAccessControl("settings/appearance");

    // Mode tabs: themes | editor | code
    const [mode, setMode] = useState("themes");
    const [editorMode, setEditorMode] = useState("dashboard");

    const {
        css, setCss, resetCss,
        themes: websiteThemes, tileThemes,
        currentTheme: currentWebsiteTheme, currentTileTheme,
        setTheme: setWebsiteTheme, setTileTheme,
        addTheme: addWebsiteTheme, addTileTheme,
        removeTheme: removeWebsiteTheme, removeTileTheme,
        resetCssDefaultThemes,
    } = useCss();

    const {
        themes: dashboardThemes, setThemes: setDashboardThemes,
        currentTheme: currentDashboardTheme, setTheme: setDashboardTheme,
    } = useTheme();

    const [defaultCode] = useState(`{
    "websiteStyle": ${JSON.stringify(css)},
    "themes": ${JSON.stringify(dashboardThemes)}
}`);
    const [code, setCode] = useState(defaultCode);
    const [error, setError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [view, setView] = useState<EditorView | null>(null);
    const [pendingSelection, setPendingSelection] = useState<{ start: number; end: number } | null>(null);

    useEffect(() => {
        if (mode !== "code" || !pendingSelection || !view) return;
        view.dispatch({
            selection: { anchor: pendingSelection.start, head: pendingSelection.end },
            scrollIntoView: true,
        });
        view.focus();
    }, [view]);

    useEffect(() => {
        async function formatCode() {
            try {
                const formatted = await prettier.format(defaultCode, {
                    semi: false,
                    parser: "json",
                    plugins: [prettierPluginBabel, prettierPluginEstree],
                });
                setCode(formatted);
            } catch { }
        }
        formatCode();
    }, []);

    // ── Data panel components (unchanged logic, reskinned container) ──────
    const DataPanel = ({ path }: { path: string[] }) => {
        let node: any = css;
        for (const segment of path) {
            if (!node[segment]) { node = null; break; }
            node = node[segment];
        }
        if (!node) return <div className="text-[var(--color-text-tertiary)] text-sm p-4">Node not found</div>;

        let styles = (node["ROOT-STYLE"] || "").trim().split(" ").map((s: string) => s.trim()).filter(Boolean);
        const conditionals: Record<string, string[]> = {
            "Sidebar Collapsed": (node["sidebarCollapsed-style"] || "").trim().split(" ").filter(Boolean),
            "Sidebar Expanded": (node["sidebarExpanded-style"] || "").trim().split(" ").filter(Boolean),
            "Active": (node["active-style"] || "").trim().split(" ").filter(Boolean),
            "Inactive": (node["inactive-style"] || "").trim().split(" ").filter(Boolean),
            "Collapsed": (node["collapsed-style"] || "").trim().split(" ").filter(Boolean),
            "Expanded": (node["expanded-style"] || "").trim().split(" ").filter(Boolean),
        };

        return (
            <div className="flex-none w-96 overflow-y-auto p-5 h-[420px]">
                <TailwindEditor classes={styles} updateClasses={() => { }} />
                {Object.entries(conditionals).map(([key, value]) => (
                    <details key={key} className="group mb-2 w-full overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-muted)]">
                        <summary className="flex list-none cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-sm font-medium text-[var(--color-text-primary)] marker:hidden">
                            <span className="truncate">{key}</span>
                            <span className="text-xs text-[var(--color-text-tertiary)] transition-transform duration-200 group-open:rotate-180">▼</span>
                        </summary>
                        <div className="border-t border-[var(--color-border-subtle)] p-2.5">
                            <TailwindEditor classes={value} updateClasses={() => { }} />
                        </div>
                    </details>
                ))}
                <button
                    className="mt-3 rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs text-white transition hover:opacity-90"
                    onClick={() => {
                        const range = getJsonPathRange(code, ["websiteStyle", ...path]);
                        if (!range) return;
                        setPendingSelection(range);
                        setMode("code");
                    }}
                >
                    Open in code editor
                </button>
            </div>
        );
    };

    const ThemeDataPanel = ({ path }: { path: string[] }) => {
        let node: any = dashboardThemes[currentDashboardTheme];
        for (const segment of path) {
            if (!node[segment]) { node = null; break; }
            node = node[segment];
        }
        if (!node) return <div className="text-[var(--color-text-tertiary)] text-sm p-4">Node not found</div>;

        if (typeof node === "string" && (node.trim()[0] === "<" || node === " ")) {
            return (
                <div className="flex-none w-96 overflow-y-auto p-5 h-[420px]">
                    <CodeMirror value={node} height="320px" extensions={[html()]} theme={atomone} />
                    <button
                        className="mt-3 rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs text-white transition hover:opacity-90"
                        onClick={() => {
                            const range = getJsonPathRange(code, ["themes", currentDashboardTheme, ...path]);
                            if (!range) return;
                            setPendingSelection(range);
                            setMode("code");
                        }}
                    >
                        Open in code editor
                    </button>
                </div>
            );
        }

        const styles = (node || "").trim().split(" ").filter(Boolean);
        return (
            <div className="flex-none w-96 overflow-y-auto p-5 h-[420px]">
                <TailwindEditor classes={styles} />
                <button
                    className="mt-3 rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs text-white transition hover:opacity-90"
                    onClick={() => {
                        const range = getJsonPathRange(code, ["themes", currentDashboardTheme, ...path]);
                        if (!range) return;
                        setPendingSelection(range);
                        setMode("code");
                    }}
                >
                    Open in code editor
                </button>
            </div>
        );
    };

    const TileDataPanel = ({ path }: { path: string[] }) => {
        let node: any = css.components.tiles;
        for (const segment of path) {
            if (!node[segment]) { node = null; break; }
            node = node[segment];
        }
        if (!node) return <div className="text-[var(--color-text-tertiary)] text-sm p-4">Node not found</div>;

        const styles = (node["ROOT-STYLE"] || "").trim().split(" ").filter(Boolean);
        const conditionals: Record<string, string[]> = {
            "Sidebar Collapsed": (node["sidebarCollapsed-style"] || "").trim().split(" ").filter(Boolean),
            "Sidebar Expanded": (node["sidebarExpanded-style"] || "").trim().split(" ").filter(Boolean),
            "Active": (node["active-style"] || "").trim().split(" ").filter(Boolean),
            "Inactive": (node["inactive-style"] || "").trim().split(" ").filter(Boolean),
        };

        return (
            <div className="flex-none w-96 overflow-y-auto p-5 h-[420px]">
                <TailwindEditor classes={styles} updateClasses={() => { }} />
                {Object.entries(conditionals).map(([key, value]) => (
                    <details key={key} className="group mb-2 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-muted)]">
                        <summary className="flex list-none cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-sm font-medium text-[var(--color-text-primary)] marker:hidden">
                            <span>{key}</span>
                            <span className="text-xs text-[var(--color-text-tertiary)] group-open:rotate-180 transition-transform">▼</span>
                        </summary>
                        <div className="border-t border-[var(--color-border-subtle)] p-2.5">
                            <TailwindEditor classes={value} updateClasses={() => { }} />
                        </div>
                    </details>
                ))}
                <button
                    className="mt-3 rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs text-white transition hover:opacity-90"
                    onClick={() => {
                        const range = getJsonPathRange(code, ["websiteStyle", "components", "tiles", ...path]);
                        if (!range) return;
                        setPendingSelection(range);
                        setMode("code");
                    }}
                >
                    Open in code editor
                </button>
            </div>
        );
    };

    // ── Node formatters (unchanged) ───────────────────────────────────────
    const formatNodesRecursive = (cssObj: Record<string, any>): Node[] =>
        Object.entries(cssObj)
            .filter(([, value]) => typeof value === "object")
            .map(([key, value]) => ({
                name: key, id: key,
                hasData: Object.values(value as Record<string, any>).some(c => c === null || typeof c !== "object"),
                children: formatNodesRecursive(value),
            }));

    const formatNodesRecursiveTheme = (themeObj: Record<string, any>): Node[] =>
        Object.entries(themeObj).map(([key, value]) => {
            if (typeof value !== "object") return { name: key, id: key, hasData: true, children: [] };
            return {
                name: key, id: key,
                hasData: Object.values(value).some(c => c === null || typeof c !== "object"),
                children: formatNodesRecursiveTheme(value),
            };
        });

    const formatNodes = () =>
        Object.entries(css)
            .filter(([key, value]) => key !== "components" && typeof value === "object")
            .map(([key, value]) => ({
                name: key, id: key,
                hasData: Object.values(value as Record<string, any>).some(c => c === null || typeof c !== "object"),
                children: formatNodesRecursive(value as Record<string, any>),
            }));

    const formatNodesTheme = () => {
        const nodes: Node[] = Object.entries(dashboardThemes[currentDashboardTheme])
            .map(([key, value]) => {
                if (typeof value !== "object") return { name: key, id: key, hasData: true, children: [] };
                return {
                    name: key, id: key,
                    hasData: Object.values(value as any).some(() => false),
                    children: formatNodesRecursiveTheme(value as any),
                };
            });
        if (!nodes.find(n => n.id === "TopBar")) {
            nodes.push({ name: "TopBar", id: "TopBar", hasData: true, children: [] });
            setDashboardThemes({ ...dashboardThemes, [currentDashboardTheme]: { ...dashboardThemes[currentDashboardTheme], TopBar: " " } });
        }
        if (!nodes.find(n => n.id === "extraHtml")) {
            nodes.push({ name: "ExtraHtml", id: "extraHtml", hasData: true, children: [] });
            setDashboardThemes({ ...dashboardThemes, [currentDashboardTheme]: { ...dashboardThemes[currentDashboardTheme], extraHtml: " " } });
        }
        return nodes;
    };

    const formatNodesTile = () =>
        Object.entries(css.components.tiles || {})
            .filter(([, value]) => typeof value === "object")
            .map(([key, value]) => ({
                name: key, id: key,
                hasData: Object.values(value as Record<string, any>).some(c => c === null || typeof c !== "object"),
                children: formatNodesRecursive(value as Record<string, any>),
            }));

    // ── Save ─────────────────────────────────────────────────────────────
    const handleSave = () => {
        try {
            const parsed = JSON.parse(code);
            if (!parsed?.websiteStyle) throw new Error("Missing websiteStyle key");
            if (!parsed?.themes) throw new Error("Missing themes key");
            setCss(parsed.websiteStyle);
            setDashboardThemes(parsed.themes);
            setError(null);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err: any) {
            setError(err.message || "Invalid JSON");
        }
    };

    if (accessLoading) return <div className="min-h-screen" />;
    if (!allowed) return <div>Unauthorized</div>;

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[var(--color-surface)] px-6 py-20">
            <div className="mx-auto max-w-5xl">

                {/* ── Header ── */}
                <Text variant="label" className="mb-2 block">Settings</Text>
                <h1 className="font-[family-name:var(--font-display)] text-[42px] leading-[1.1] tracking-[-0.01em] font-normal text-[var(--color-text-primary)]">
                    Appearance
                </h1>
                <p className="mt-3 text-lg leading-[1.7] text-[var(--color-text-secondary)]">
                    Choose themes, tweak styles visually, or go <em className="italic text-[var(--color-text-tertiary)]">deep into the code</em>.
                </p>

                <div className="my-10 h-px w-full bg-[var(--color-border-subtle)]" />

                {/* ── Mode tabs ── */}
                <div className="mb-8 flex flex-wrap items-center gap-3">
                    <div className="flex gap-0.5 rounded-[var(--radius-md)] bg-[var(--color-muted)] p-0.5">
                        {[
                            { value: "themes", label: "Themes" },
                            { value: "editor", label: "Visual editor" },
                            { value: "code", label: "Code" },
                        ].map(({ value, label }) => (
                            <button
                                key={value}
                                onClick={() => setMode(value)}
                                className={[
                                    "rounded-[calc(var(--radius-md)-2px)] px-4 py-1.5 text-sm font-medium transition-all duration-[var(--duration-fast)]",
                                    mode === value
                                        ? "bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] shadow-[var(--shadow-sm)]"
                                        : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]",
                                ].join(" ")}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {mode === "editor" && (
                        <div className="flex gap-0.5 rounded-[var(--radius-md)] bg-[var(--color-muted)] p-0.5">
                            {[
                                { value: "dashboard", label: "Dashboard" },
                                { value: "website", label: "Website" },
                                { value: "tiles", label: "Tiles" },
                            ].map(({ value, label }) => (
                                <button
                                    key={value}
                                    onClick={() => setEditorMode(value)}
                                    className={[
                                        "rounded-[calc(var(--radius-md)-2px)] px-4 py-1.5 text-sm font-medium transition-all duration-[var(--duration-fast)]",
                                        editorMode === value
                                            ? "bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] shadow-[var(--shadow-sm)]"
                                            : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]",
                                    ].join(" ")}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    )}

                    {(mode === "code" || mode === "editor" || mode === "themes") && (
                        <Link
                            href={
                                mode === "code" ? "/docs/developers/customization#code-editor"
                                    : mode === "editor" ? "/docs/users/customization#visual-editor"
                                        : "/docs/developers/customization#ugc"
                            }
                            className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-info)]/80 px-3 py-1.5 text-sm text-white transition hover:bg-[var(--color-info)]"
                        >
                            <Book className="h-3.5 w-3.5" />
                            Docs
                        </Link>
                    )}
                </div>

                {/* ════════════════════════════════
                        THEMES TAB
                    ════════════════════════════════ */}
                {mode === "themes" && (
                    <div className="space-y-12">

                        {/* Dashboard themes */}
                        <div>
                            <SectionHeading
                                title="Dashboard themes"
                                description="Control the borders, decorations, and visual personality of your tiles."
                            />
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                                {Object.keys(dashboardThemes).map((key) => (
                                    <ThemeCard
                                        key={key}
                                        themeKey={key}
                                        imageUrl={dashboardThemes[key].imageUrl}
                                        active={currentDashboardTheme === key}
                                        type="dashboard"
                                        isBuiltin={builtin.includes(key)}
                                        onActivate={() => {
                                            setDashboardTheme(key);
                                            window.location.reload();
                                        }}
                                        onDelete={() => {
                                            const { [key]: _, ...rest } = dashboardThemes;
                                            setDashboardThemes(rest);
                                        }}
                                    />
                                ))}
                                <BrowseThemeCard
                                    href="/themes?filter-type=dashboard"
                                    label="Browse community themes"
                                />
                            </div>
                        </div>

                        {/* Website themes */}
                        <div>
                            <SectionHeading
                                title="Website themes"
                                description="Personalise the app shell — navigation, surfaces, and typography."
                            />
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                                {Object.keys(websiteThemes).map((key) => (
                                    <ThemeCard
                                        key={key}
                                        themeKey={key}
                                        active={currentWebsiteTheme === key}
                                        type="website"
                                        onActivate={() => setWebsiteTheme(key)}
                                        onDuplicate={() => {
                                            const name = prompt("Name for copied theme:", `${key}-copy`);
                                            if (name) addWebsiteTheme(name, websiteThemes[key]);
                                        }}
                                        onDelete={() => removeWebsiteTheme(key)}
                                    />
                                ))}
                                <CreateThemeCard
                                    label="New website theme"
                                    onClick={() => {
                                        const name = prompt("New theme name:", "custom-website");
                                        if (!name) return;
                                        addWebsiteTheme(name, css);
                                        setWebsiteTheme(name);
                                    }}
                                />
                                <BrowseThemeCard
                                    href="/themes?filter-type=tile"
                                    label="Browse community themes"
                                />
                            </div>
                        </div>

                        {/* Tile themes */}
                        <div>
                            <SectionHeading
                                title="Tile themes"
                                description="Change how individual tiles look on your dashboard."
                            />
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                                {Object.keys(tileThemes).map((key) => (
                                    <ThemeCard
                                        key={key}
                                        themeKey={key}
                                        active={currentTileTheme === key}
                                        type="tile"
                                        onActivate={() => setTileTheme(key)}
                                        onDuplicate={() => {
                                            const name = prompt("Name for copied tile theme:", `${key}-copy`);
                                            if (name) addTileTheme(name, tileThemes[key]);
                                        }}
                                        onDelete={() => removeTileTheme(key)}
                                    />
                                ))}
                                <CreateThemeCard
                                    label="New tile theme"
                                    onClick={() => {
                                        const name = prompt("New tile theme name:", "custom-tiles");
                                        if (!name) return;
                                        addTileTheme(name, css.components.tiles);
                                        setTileTheme(name);
                                    }}
                                />
                                <BrowseThemeCard
                                    href="/themes?filter-type=website"
                                    label="Browse community themes"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* ════════════════════════════════
                        VISUAL EDITOR TAB
                    ════════════════════════════════ */}
                {mode === "editor" && (
                    <div>
                        <div className="mb-4 flex items-center gap-3">
                            <Button
                                size="sm"
                                variant="success"
                                onClick={handleSave}
                            >
                                Save changes
                            </Button>
                            {saveSuccess && (
                                <span className="text-sm text-[var(--color-success)]">Saved.</span>
                            )}
                        </div>

                        {editorMode === "dashboard" && (
                            currentDashboardTheme === "custom" ? (
                                <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] overflow-hidden">
                                    <JSONNavigator
                                        nodes={formatNodesTheme()}
                                        title="Custom theme editor"
                                        DataComponent={ThemeDataPanel}
                                    />
                                </div>
                            ) : (
                                <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-muted)] p-6 space-y-3">
                                    <p className="text-[var(--color-text-secondary)]">
                                        You're on the <span className="font-medium text-[var(--color-text-primary)]">{currentDashboardTheme}</span> theme.
                                        The visual editor only works on a custom theme.
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                setDashboardThemes({ ...dashboardThemes, custom: dashboardThemes[currentDashboardTheme] });
                                                setDashboardTheme("custom");
                                            }}
                                        >
                                            Fork &amp; switch to custom
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setDashboardTheme("custom")}
                                        >
                                            Switch to existing custom
                                        </Button>
                                    </div>
                                    <p className="text-xs text-[var(--color-text-tertiary)]">Forking will overwrite your existing custom theme.</p>
                                </div>
                            )
                        )}

                        {editorMode === "website" && (
                            <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] overflow-hidden">
                                <JSONNavigator
                                    nodes={formatNodes()}
                                    title="Website editor"
                                    DataComponent={DataPanel}
                                />
                            </div>
                        )}

                        {editorMode === "tiles" && (
                            <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] overflow-hidden">
                                <JSONNavigator
                                    nodes={formatNodesTile()}
                                    title="Tile editor"
                                    DataComponent={TileDataPanel}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* ════════════════════════════════
                        CODE TAB
                    ════════════════════════════════ */}
                {mode === "code" && (
                    <div className="space-y-4">
                        <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)]">
                            <CodeMirror
                                value={code}
                                height="560px"
                                extensions={[json()]}
                                onChange={(value) => setCode(value)}
                                onCreateEditor={(v) => setView(v)}
                                theme={atomone}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <Button size="sm" variant="success" onClick={handleSave}>
                                Save
                            </Button>
                            {saveSuccess && (
                                <span className="text-sm text-[var(--color-success)]">Saved.</span>
                            )}
                            {error && (
                                <Alert
                                    variant="danger"
                                    title="Parse error"
                                    description={error}
                                    onClose={() => setError(null)}
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}