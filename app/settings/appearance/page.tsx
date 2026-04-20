"use client";
import { useState, useEffect } from "react";
import Switcher from "@/components/Switcher";
import Editor from "@monaco-editor/react";
import { useCss } from "@/lib/css";
import * as prettier from "prettier";
import prettierPluginBabel from "prettier/plugins/babel";
import prettierPluginEstree from "prettier/plugins/estree";
import Link from "next/link";
const backgroundImage = "/images/backgrounds/builtin/onboarding.png";

export default function AppearanceSettings() {
    const [mode, setMode] = useState("themes");
    const { css, setCss } = useCss();
    const [defaultCode, setDefaultCode] = useState(`{
    "websiteStyle": ${JSON.stringify(css)}
}`);
    const [code, setCode] = useState(defaultCode);

    const [error, setError] = useState<string | null>(null);

    const handleSave = () => {
        try {
            const parsed = JSON.parse(code);

            if (!parsed?.websiteStyle) {
                throw new Error("Missing websiteStyle key");
            }

            setCss(parsed.websiteStyle);
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
                            <h2 className="text-lg font-bold mb-2">Visual Editor</h2>
                            <p>
                                Customize the visual editor settings to enhance your editing
                                experience.
                            </p>
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
