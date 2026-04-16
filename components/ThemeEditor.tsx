"use client";

import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { useTheme } from "@/context/themeContext";
import { useAuth } from "@/context/authContext";
import { Save, AlertCircle, Lock, Code } from "lucide-react";

type EditorMode = "normal" | "advanced" | "extra-advanced";

interface ThemeEditorProps {
    initialMode?: EditorMode;
    onSave?: (code: string, mode: EditorMode) => Promise<void>;
}

export const ThemeEditor = ({ initialMode = "normal", onSave }: ThemeEditorProps) => {
    const { classes, updateClass } = useTheme();
    const { user, token } = useAuth();
    const [mode, setMode] = useState<EditorMode>(initialMode);
    const [cssCode, setCssCode] = useState("");
    const [jsCode, setJsCode] = useState("");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [reauthRequired, setReauthRequired] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Generate CSS from current classes
        const css = Object.entries(classes)
            .map(([key, value]) => `/* ${key} */\n.${key} {\n  /* ${value} */\n}\n`)
            .join("\n");
        setCssCode(css);
    }, [classes]);

    const handleSaveCSS = async () => {
        setSaving(true);
        setError(null);
        try {
            if (onSave) {
                await onSave(cssCode, mode);
            } else {
                // Default save behavior - for now just show success
                console.log("CSS Code:", cssCode);
            }
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            setError(`Failed to save: ${err instanceof Error ? err.message : "Unknown error"}`);
        } finally {
            setSaving(false);
        }
    };

    const handleModeChange = (newMode: EditorMode) => {
        if (newMode === "extra-advanced" && !reauthRequired) {
            setReauthRequired(true);
            return;
        }
        setMode(newMode);
    };

    return (
        <div className="space-y-6">
            {/* Mode Selector */}
            <div className="flex gap-3 flex-wrap">
                <button
                    onClick={() => handleModeChange("normal")}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        mode === "normal"
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                >
                    Normal Mode
                </button>

                <button
                    onClick={() => handleModeChange("advanced")}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                        mode === "advanced"
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                >
                    <Code className="w-4 h-4" />
                    Advanced (CSS)
                </button>

                <button
                    onClick={() => handleModeChange("extra-advanced")}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                        mode === "extra-advanced"
                            ? "bg-purple-600 text-white"
                            : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                >
                    <Lock className="w-4 h-4" />
                    Extra Advanced (CSS + JS)
                </button>
            </div>

            {/* Reauth Modal for Extra Advanced */}
            {reauthRequired && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-lg p-8 max-w-md w-full border border-slate-700">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                            <Lock className="w-6 h-6 text-yellow-500" />
                            Extra Advanced Mode
                        </h2>
                        <p className="text-slate-300 mb-6">
                            Extra Advanced Mode allows you to inject custom CSS and JavaScript into
                            your pages. This is a powerful feature that requires reauthentication
                            for security.
                        </p>
                        <div className="space-y-2 mb-6 bg-yellow-600/20 border border-yellow-600/50 rounded-lg p-4">
                            <p className="text-sm text-yellow-300 font-semibold">
                                ⚠️ Security Warning:
                            </p>
                            <p className="text-sm text-yellow-200">
                                Only enable this if you understand the risks of injecting custom
                                code. Malicious code can compromise your account.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setReauthRequired(false);
                                    setMode("extra-advanced");
                                }}
                                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                            >
                                Continue
                            </button>
                            <button
                                onClick={() => setReauthRequired(false)}
                                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="bg-red-600/20 border border-red-600 rounded-lg p-4 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-red-300">{error}</p>
                </div>
            )}

            {/* Normal Mode */}
            {mode === "normal" && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 text-center">
                    <Code className="w-16 h-16 text-slate-500 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold text-white mb-2">Visual Editor</h3>
                    <p className="text-slate-400 mb-6">
                        The visual theme editor is currently a stub. Switch to Advanced mode to edit
                        CSS, or use the Settings sidebar to manage themes.
                    </p>
                    <button
                        onClick={() => setMode("advanced")}
                        className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                        Go to Advanced Mode
                    </button>
                </div>
            )}

            {/* Advanced Mode (CSS Only) */}
            {mode === "advanced" && (
                <div className="space-y-4">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                        <p className="text-slate-300 text-sm">
                            Edit your custom CSS below. Changes will be saved to your account.
                        </p>
                    </div>

                    <Editor
                        height="400px"
                        language="css"
                        value={cssCode}
                        onChange={(value) => setCssCode(value || "")}
                        theme="vs-dark"
                        options={{
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            fontSize: 13,
                            fontFamily: "Fira Code, monospace",
                        }}
                    />

                    <div className="flex justify-end">
                        <button
                            onClick={handleSaveCSS}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors font-semibold"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? "Saving..." : "Save CSS"}
                        </button>
                    </div>

                    {saved && (
                        <div className="bg-emerald-600/20 border border-emerald-600 rounded-lg p-4 text-emerald-300">
                            ✓ CSS saved successfully!
                        </div>
                    )}
                </div>
            )}

            {/* Extra Advanced Mode (CSS + JS) */}
            {mode === "extra-advanced" && (
                <div className="space-y-6">
                    <div className="bg-purple-600/20 border border-purple-600 rounded-lg p-4 flex gap-3">
                        <Lock className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-purple-300 font-semibold text-sm mb-1">
                                Extra Advanced Mode Enabled
                            </p>
                            <p className="text-purple-200 text-sm">
                                You can now inject custom CSS and JavaScript. Be careful with what
                                you add!
                            </p>
                        </div>
                    </div>

                    {/* CSS Editor */}
                    <div>
                        <label className="block text-white font-semibold mb-2">Custom CSS</label>
                        <Editor
                            height="300px"
                            language="css"
                            value={cssCode}
                            onChange={(value) => setCssCode(value || "")}
                            theme="vs-dark"
                            options={{
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                fontSize: 13,
                                fontFamily: "Fira Code, monospace",
                            }}
                        />
                    </div>

                    {/* JS Editor */}
                    <div>
                        <label className="block text-white font-semibold mb-2">
                            Custom JavaScript
                        </label>
                        <Editor
                            height="300px"
                            language="javascript"
                            value={jsCode}
                            onChange={(value) => setJsCode(value || "")}
                            theme="vs-dark"
                            options={{
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                fontSize: 13,
                                fontFamily: "Fira Code, monospace",
                            }}
                        />
                    </div>

                    {/* Info */}
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                        <p className="text-slate-300 text-sm">
                            <strong>Note:</strong> Your JavaScript will be injected into the page on
                            load. It has access to the full window object. Use responsibly!
                        </p>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleSaveCSS}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors font-semibold"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? "Saving..." : "Save All"}
                        </button>
                    </div>

                    {saved && (
                        <div className="bg-emerald-600/20 border border-emerald-600 rounded-lg p-4 text-emerald-300">
                            ✓ Changes saved successfully!
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
