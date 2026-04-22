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

    const editorViewRef = useRef<EditorView | null>(null);

    useEffect(() => {
        if (mode !== "code") return;
        if (!pendingSelection) return;

        const view = editorViewRef.current;
        if (!view) return;

        const apply = () => {
            const state = view.state;

            if (!state) {
                requestAnimationFrame(apply);
                return;
            }

            const { start, end } = pendingSelection;

            const selection = EditorSelection.range(start, end);

            view.dispatch({
                selection,
                scrollIntoView: true,
            });

            view.focus();
            setPendingSelection(null);
        };

        requestAnimationFrame(apply);
    }, [mode, pendingSelection]);

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
        return (
            <div className="p-5 h-105 w-96 overflow-scroll flex-none">
                <TailwindEditor classes={styles} />
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
        if (node.trim()[0] === "<") {
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
                {/* LEFT PANEL: step list */}
                <div className="w-full min-w-70 rounded-2xl ring-1 ring-white/50 bg-white/30 backdrop-blur-lg overflow-hidden flex flex-col shadow-xl">
                    <div className="content-center p-4">
                        <Switcher
                            options={[
                                { label: "Themes", value: "themes" },
                                { label: "Visual editor", value: "editor" },
                                { label: "Code (Advanced)", value: "code" },
                            ]}
                            value={mode}
                            onChange={(val: string) => setMode(val)}
                        />
                    </div>
                    {mode === "themes" && (
                        <div className="p-4 text-white">
                            <h2 className="text-lg font-bold mb-2">Themes</h2>
                            <p>
                                Choose from a variety of themes to customize the look and feel of
                                the app.
                            </p>
                        </div>
                    )}

                    {mode === "editor" && (
                        <div className="p-4 text-white">
                            <Switcher
                                options={[
                                    { label: "Dashboard editor", value: "themes" },
                                    { label: "Website editor", value: "website" },
                                ]}
                                value={editorMode}
                                onChange={(val: string) => setEditorMode(val)}
                            />
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
                                    editorViewRef.current = view;
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
