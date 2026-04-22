"use client";
import { useState, useEffect, type ComponentType } from "react";
import Switcher from "@/components/Switcher";
import Editor from "@monaco-editor/react";
import { useCss } from "@/lib/css";
import { useTheme } from "@/context/themeContext";
import * as prettier from "prettier";
import prettierPluginBabel from "prettier/plugins/babel";
import prettierPluginEstree from "prettier/plugins/estree";
import Link from "next/link";
import JSONNavigator from "@/components/JSONNavigation";
import { Node } from "@/components/JSONNavigation";
import { TailwindEditor } from "@/components/TailwindEditor";
const backgroundImage = "/images/backgrounds/builtin/onboarding.png";

export default function AppearanceSettings() {
    const [mode, setMode] = useState("themes");
    const [editorMode, setEditorMode] = useState("themes");
    const { css, setCss } = useCss();
    const { themes, setThemes, currentTheme } = useTheme();
    const [defaultCode, setDefaultCode] = useState(`{
    "websiteStyle": ${JSON.stringify(css)},
    "themes": ${JSON.stringify(themes)}
}`);
    const [code, setCode] = useState(defaultCode);

    const [error, setError] = useState<string | null>(null);

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
        if (!node) return <div>Node not found</div>;
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
                <h2 className="text-black">Editing</h2>
                <TailwindEditor classes={styles} />
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
                                        <div></div>
                                    ) : (
                                        <div>
                                            <h3>You are currently not on a custom theme.</h3>
                                            <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition">
                                                Fork current theme and switch
                                            </button>
                                            <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition">
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
                            <Editor
                                height="500px"
                                language="json"
                                value={code}
                                onChange={(val) => {
                                    setCode(val || "");
                                }}
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
