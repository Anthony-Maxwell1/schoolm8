"use client";
import { useState, useEffect, useRef } from "react";
import Switcher from "@/components/Switcher";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { EditorView, Decoration, ViewPlugin } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { EditorSelection } from "@codemirror/state";
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

const backgroundImage = "/images/backgrounds/builtin/onboarding.png";

function getJsonPathRange(json: string, path: (string | number)[]) {
    const tree = parseTree(json);
    if (!tree) return null;

    const node = findNodeAtLocation(tree, path);
    if (!node) return null;

    return {
        start: node.offset,
        end: node.offset + node.length,
    };
}

export default function AppearanceSettings() {
    const [mode, setMode] = useState("themes");
    const [editorMode, setEditorMode] = useState("themes");
    const { css, setCss } = useCss();
    const { themes, setThemes, currentTheme, setTheme } = useTheme();
    const [defaultCode, setDefaultCode] = useState(`{
    "websiteStyle": ${JSON.stringify(css)},
    "themes": ${JSON.stringify(themes)}
}`);
    const [pendingSelection, setPendingSelection] = useState<{
        start: number;
        end: number;
    } | null>(null);
    const [code, setCode] = useState(defaultCode);

    const [error, setError] = useState<string | null>(null);

    const [view, setView] = useState<EditorView | null>(null);

    useEffect(() => {
        if (mode !== "code") return;
        if (!pendingSelection) return;
        console.log(view);
        if (!view) return;

        console.log(pendingSelection);
        console.log(view.state);

        view.dispatch({
            selection: { anchor: pendingSelection.start, head: pendingSelection.end },
            scrollIntoView: true,
        });

        view.focus();
    }, [view]);

    const DataPanel = ({ path }: { path: string[] }) => {
        // id is a path {id}.{id}.{id} and so on
        let node: any = css;
        for (const segment of path) {
            if (!node[segment]) {
                node = null;
                break;
            }
            node = node[segment];
        }
        if (!node) return <div className="text-black">Node not found</div>;
        let styles = node["ROOT-STYLE"] || "";
        let conditionals: Record<string, string | string[]> = {
            "Sidebar Collapsed": node["sidebarCollapsed-style"] || "",
            "Sidebar Expanded": node["sidebarExpanded-style"] || "",
            Active: node["active-style"] || "",
            inactive: node["inactive-style"] || "",
            Collapsed: node["collapsed-style"] || "",
            Expanded: node["expanded-style"] || "",
        };
        styles = styles
            .trim()
            .split(" ")
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0);
        for (const key in conditionals) {
            conditionals[key] = (conditionals[key] as string)
                .trim()
                .split(" ")
                .map((s: string) => s.trim())
                .filter((s: string) => s.length > 0);
        }
        function setClasses(newClasses: string[], conditional?: string) {
            // Implementation for updating classes
        }

        return (
            <div className="p-5 h-105 w-96 overflow-scroll flex-none">
                <TailwindEditor classes={styles} updateClasses={setClasses} />
                {Object.entries(conditionals).map(([key, value]) => {
                    return (
                        <details
                            key={key}
                            className="group mb-2 w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white/90 text-slate-800 shadow-sm transition-all duration-200 hover:border-slate-300 open:shadow-md"
                        >
                            <summary className="flex list-none cursor-pointer items-center justify-between gap-3 bg-linear-to-r from-slate-50 via-white to-slate-100 px-3 py-2.5 font-medium marker:hidden">
                                <span className="truncate">{key}</span>
                                <span className="text-xs text-slate-500 transition-transform duration-200 group-open:rotate-180">
                                    ▼
                                </span>
                            </summary>
                            <div className="border-t border-slate-200/80 bg-white p-2.5">
                                <TailwindEditor
                                    classes={value as string[]}
                                    updateClasses={(newClasses) => setClasses(newClasses, key)}
                                />
                            </div>
                        </details>
                    );
                })}
                <button
                    className="mt-2 p-0.5 px-2 rounded-full bg-blue-600 cursor-pointer hover:bg-blue-400 transition-all"
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
        // id is a path {id}.{id}.{id} and so on
        let node: any = themes[currentTheme];
        for (const segment of path) {
            if (!node[segment]) {
                node = null;
                break;
            }
            node = node[segment];
        }
        if (!node) return <div className="text-black">Node not found</div>;
        if (node.trim()[0] === "<" || node == " ") {
            return (
                <div className="p-5 h-105 w-96 overflow-scroll flex-none">
                    <CodeMirror
                        value={node}
                        height="500px"
                        extensions={[html()]}
                        // onChange={(value) => setCode(value)}
                        theme={atomone}
                    />
                    <button
                        className="mt-2 p-0.5 px-2 rounded-full bg-blue-600 cursor-pointer hover:bg-blue-400 transition-all"
                        onClick={() => {
                            const range = getJsonPathRange(code, ["themes", currentTheme, ...path]);
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
        let styles = node || "";
        styles = styles
            .trim()
            .split(" ")
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0);
        return (
            <div className="p-5 h-105 w-96 overflow-scroll flex-none">
                <TailwindEditor classes={styles} />
                <button
                    className="mt-2 p-0.5 px-2 rounded-full bg-blue-600 cursor-pointer hover:bg-blue-400 transition-all"
                    onClick={() => {
                        const range = getJsonPathRange(code, ["themes", currentTheme, ...path]);
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

    const formatNodesRecursive = (cssObj: Record<string, any>) => {
        const nodes: Node[] = [];
        for (const [key, value] of Object.entries(cssObj)) {
            if (typeof value !== "object") continue;
            const hasNonObjectValue = Object.values(value as Record<string, any>).some(
                (child) => child === null || typeof child !== "object",
            );

            const node: Node = {
                name: key,
                id: key,
                hasData: hasNonObjectValue,
                children: formatNodesRecursive(value),
            };
            nodes.push(node);
        }
        return nodes;
    };

    const formatNodesRecursiveTheme = (themeObj: Record<string, any>) => {
        const nodes: Node[] = [];
        for (const [key, value] of Object.entries(themeObj)) {
            const hasNonObjectValue = Object.values(value).some(
                (child) => child === null || typeof child !== "object",
            );

            console.log(key);

            if (typeof value !== "object") {
                const node: Node = {
                    name: key,
                    id: key,
                    hasData: true,
                    children: [],
                };
                nodes.push(node);
                continue;
            }

            const node: Node = {
                name: key,
                id: key,
                hasData: hasNonObjectValue,
                children: formatNodesRecursiveTheme(value),
            };
            nodes.push(node);
        }
        return nodes;
    };

    const formatNodes = () => {
        const nodes: any[] = [];
        for (const [key, value] of Object.entries(css)) {
            if (typeof value !== "object") continue;
            const hasNonObjectValue = Object.values(value as Record<string, any>).some(
                (child) => child === null || typeof child !== "object",
            );

            const node: any = {
                name: key,
                id: key,
                hasData: hasNonObjectValue,
                children: formatNodesRecursive(value),
            };
            nodes.push(node);
        }
        console.log(nodes);
        return nodes;
    };

    const formatNodesTheme = () => {
        const nodes: any[] = [];
        for (const [key, value] of Object.entries(themes[currentTheme])) {
            const hasNonObjectValue = Object.values(value).some((child) => false);

            if (typeof value !== "object") {
                const node: any = {
                    name: key,
                    id: key,
                    hasData: true,
                    children: [],
                };
                nodes.push(node);
                continue;
            }

            console.log("a");

            const node: any = {
                name: key,
                id: key,
                hasData: hasNonObjectValue,
                children: formatNodesRecursiveTheme(value),
            };
            nodes.push(node);
        }
        if (!nodes.find((n) => n.id === "TopBar")) {
            const topBarNode: any = {
                name: "TopBar",
                id: "TopBar",
                hasData: true,
                children: [],
            };
            nodes.push(topBarNode);
            setThemes({ ...themes, [currentTheme]: { ...themes[currentTheme], TopBar: "" } });
        }
        if (!nodes.find((n) => n.id === "extraHtml")) {
            const extraHtmlNode: any = {
                name: "ExtraHtml",
                id: "extraHtml",
                hasData: true,
                children: [],
            };
            nodes.push(extraHtmlNode);
            setThemes({
                ...themes,
                [currentTheme]: { ...themes[currentTheme], extraHtml: " " },
            });
        }
        console.log(nodes);
        return nodes;
    };

    const handleSave = () => {
        try {
            const parsed = JSON.parse(code);

            if (!parsed?.websiteStyle) {
                throw new Error("Missing websiteStyle key");
            }

            if (!parsed?.themes) {
                throw new Error("Missing themes key");
            }

            setCss(parsed.websiteStyle);
            setThemes(parsed.themes);
            setError(null);
        } catch (err: any) {
            setError(err.message || "Invalid JSON");
        }
    };

    useEffect(() => {
        async function formatCode() {
            try {
                const formatted = await prettier.format(defaultCode, {
                    semi: false,
                    parser: "json",
                    plugins: [prettierPluginBabel, prettierPluginEstree],
                });
                setCode(formatted);
            } catch (err) {
                console.error(err);
            }
        }

        formatCode();
    }, []);
    return (
        <div
            className="relative min-h-screen bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImage})`, backgroundAttachment: "fixed" }}
        >
            <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/30 to-black/50 backdrop-blur-sm" />
            {/* Main container */}
            <div className="relative z-10 flex min-h-screen items-center justify-center px-6 gap-8">
                <div className="w-full min-w-70 rounded-2xl ring-1 ring-white/50 bg-white/30 backdrop-blur-lg overflow-hidden flex flex-col shadow-xl">
                    <div className="content-center p-4 flex flex-row gap-6">
                        <Switcher
                            options={[
                                { label: "Themes", value: "themes" },
                                { label: "Visual editor", value: "editor" },
                                { label: "Code (Advanced)", value: "code" },
                            ]}
                            value={mode}
                            onChange={(val: string) => setMode(val)}
                        />
                        {mode === "editor" && (
                            <Switcher
                                options={[
                                    { label: "Dashboard editor", value: "themes" },
                                    { label: "Website editor", value: "website" },
                                ]}
                                value={editorMode}
                                onChange={(val: string) => setEditorMode(val)}
                            />
                        )}
                        {mode === "code" && (
                            <Link
                                href="/docs/developers/customization#code-editor"
                                className="flex items-center gap-2 text-white hover:bg-blue-800 hover:scale-110 transition-all bg-blue-400 px-2 rounded-md"
                            >
                                <Book />
                            </Link>
                        )}
                        {mode === "editor" && (
                            <Link
                                href="/docs/users/customization#visual-editor"
                                className="flex items-center gap-2 text-white hover:bg-blue-800 hover:scale-110 transition-all bg-blue-400 px-2 rounded-md"
                            >
                                <Book />
                            </Link>
                        )}
                        {mode === "themes" && (
                            <Link
                                href="/docs/developers/customization#ugc"
                                className="flex items-center gap-2 text-white hover:bg-blue-800 hover:scale-110 transition-all bg-blue-400 px-2 rounded-md"
                            >
                                <Book />
                            </Link>
                        )}
                    </div>
                    {mode === "themes" && (
                        <div className="p-4 text-white">
                            <h3 className="text-white text-xl font-bold">Dashboard Themes</h3>
                            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4 mt-3">
                                {Object.keys(themes).map((key) => (
                                    <button
                                        key={key}
                                        className="group relative overflow-hidden rounded-2xl border border-white/20 bg-white/95 text-black shadow-lg transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl cursor-pointer"
                                        onClick={() => {
                                            setTheme(key);
                                            window.location.reload();
                                        }}
                                    >
                                        <div className="relative aspect-4/3 w-full overflow-hidden bg-linear-to-br from-slate-100 via-white to-slate-200">
                                            {themes[key].imageUrl ? (
                                                <img
                                                    src={themes[key].imageUrl}
                                                    alt={key}
                                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-slate-700 via-slate-600 to-slate-900 text-white">
                                                    <div className="text-center px-4">
                                                        <div className="text-sm uppercase tracking-[0.35em] text-white/70">
                                                            Preview unavailable
                                                        </div>
                                                        <div className="mt-2 text-lg font-semibold">
                                                            {key}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 via-black/20 to-transparent p-4 text-left text-white">
                                                <div className="text-xs uppercase tracking-[0.3em] text-white/70">
                                                    Theme
                                                </div>
                                                <div className="text-lg font-semibold capitalize">
                                                    {key}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                                <a
                                    key="view-community"
                                    className="group relative overflow-hidden rounded-2xl border border-white/20 bg-white/95 text-black shadow-lg transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl cursor-pointer"
                                    href="/themes?filter-type=dashboard"
                                >
                                    <div className="relative aspect-4/3 w-full overflow-hidden bg-linear-to-br from-slate-100 via-white to-slate-200">
                                        <Image
                                            src={"https://picsum.photos/600/400"}
                                            alt="Community Themes"
                                            fill
                                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                                        />

                                        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 via-black/20 to-transparent p-4 text-left text-white">
                                            <div className="text-lg font-semibold capitalize">
                                                Browse Community Themes
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            </div>
                            <h3 className="text-white text-xl font-bold mt-6">Website Themes</h3>
                            <p className="mt-1 text-sm text-white/80">
                                Personalize your website look, or reset back to defaults.
                            </p>
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
                                <Link
                                    href="/themes?filter-type=website"
                                    className="group relative overflow-hidden rounded-2xl border border-white/20 bg-white/95 text-black shadow-lg transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl cursor-pointer min-h-30"
                                >
                                    <div className="relative h-full w-full overflow-hidden bg-linear-to-br from-slate-100 via-white to-slate-200">
                                        <Image
                                            src={"https://picsum.photos/600/400"}
                                            alt="Website Community Themes"
                                            fill
                                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                                        />

                                        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent" />
                                        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 text-left text-white">
                                            <div className="text-xs uppercase tracking-[0.3em] text-white/70">
                                                Website Themes
                                            </div>
                                            <div className="text-lg font-semibold capitalize">
                                                Browse Community Themes
                                            </div>
                                        </div>
                                    </div>
                                </Link>

                                <button
                                    key="reset-theme"
                                    type="button"
                                    className="group relative overflow-hidden rounded-2xl border border-red-200/70 bg-white/95 text-black shadow-lg transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl cursor-pointer min-h-30 text-left"
                                    onClick={() => {
                                        // Handle reset theme logic
                                    }}
                                >
                                    <div className="absolute inset-0 bg-linear-to-br from-rose-50 via-white to-red-100 opacity-95" />
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.25),transparent_55%)]" />

                                    <div className="relative flex h-full w-full items-end p-4">
                                        <div>
                                            <div className="text-xs uppercase tracking-[0.3em] text-red-700/80">
                                                Reset
                                            </div>
                                            <div className="mt-1 text-lg font-semibold text-red-900">
                                                Reset Website Theme
                                            </div>
                                            <div className="mt-1 text-xs text-red-900/70">
                                                Revert style changes and return to default
                                                appearance.
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {mode === "editor" && (
                        <div className="p-4 text-white">
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition"
                            >
                                Save
                            </button>
                            {editorMode === "themes" && (
                                <div>
                                    {currentTheme == "custom" ? (
                                        <div>
                                            <JSONNavigator
                                                nodes={formatNodesTheme()}
                                                title="Custom Theme Editor"
                                                DataComponent={ThemeDataPanel}
                                            ></JSONNavigator>
                                        </div>
                                    ) : (
                                        <div>
                                            <h3>You are currently not on a custom theme.</h3>
                                            <button
                                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition"
                                                onClick={() => {
                                                    setThemes({
                                                        ...themes,
                                                        custom: themes[currentTheme],
                                                    });
                                                    setTheme("custom");
                                                    window.location.reload();
                                                }}
                                            >
                                                Fork current theme and switch
                                            </button>
                                            <button
                                                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition"
                                                onClick={() => {
                                                    setTheme("custom");
                                                    window.location.reload();
                                                }}
                                            >
                                                Switch to custom
                                            </button>
                                            Note: forking will override your current custom theme.
                                        </div>
                                    )}
                                </div>
                            )}
                            {editorMode === "website" && (
                                <div>
                                    <JSONNavigator
                                        nodes={formatNodes()}
                                        title="Website Editor"
                                        DataComponent={DataPanel}
                                    ></JSONNavigator>
                                </div>
                            )}
                        </div>
                    )}
                    {mode === "code" && (
                        <div className="p-4 text-white">
                            <h2 className="text-lg font-bold mb-2">
                                Code (Advanced)
                                <Link
                                    href="/docs/developers/customization#code-editor"
                                    className="text-white bg-green-300 rounded-full"
                                ></Link>
                            </h2>
                            <a href=""></a>
                            <CodeMirror
                                value={code}
                                height="500px"
                                extensions={[json()]}
                                onChange={(value) => setCode(value)}
                                onCreateEditor={(view) => {
                                    setView(view);
                                }}
                                theme={atomone}
                            />
                            <div className="mt-4 flex items-center gap-3">
                                <button
                                    onClick={handleSave}
                                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition"
                                >
                                    Save
                                </button>

                                {error && <span className="text-red-300 text-sm">{error}</span>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
