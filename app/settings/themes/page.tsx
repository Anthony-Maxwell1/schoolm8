"use client";

import { useTheme } from "@/context/themeContext";
import { useAuth } from "@/context/authContext";
import { ThemeEditor } from "@/components/ThemeEditor";
import { useState, useEffect } from "react";
import { Palette, Download, Share2, Save } from "lucide-react";
import Link from "next/link";

interface Theme {
    id: string;
    name: string;
    description: string;
    preview?: string;
    isBuiltin: boolean;
    isCustom: boolean;
}

const BUILTIN_THEMES: Theme[] = [
    {
        id: "blur",
        name: "Blur",
        description: "Modern frosted glass effect with blur",
        preview: "gradient-to-br from-slate-900 via-slate-800 to-slate-900 backdrop-blur",
        isBuiltin: true,
        isCustom: false,
    },
    {
        id: "light",
        name: "Light",
        description: "Clean and bright light theme",
        preview: "bg-gradient-to-br from-white to-slate-100",
        isBuiltin: true,
        isCustom: false,
    },
    {
        id: "dark",
        name: "Dark",
        description: "Deep dark theme for low-light environments",
        preview: "bg-gradient-to-br from-slate-950 to-black",
        isBuiltin: true,
        isCustom: false,
    },
    {
        id: "community",
        name: "Community",
        description: "Community-created themes (stub)",
        preview: "bg-gradient-to-br from-purple-900 to-pink-900",
        isBuiltin: true,
        isCustom: false,
    },
];

export default function ThemesSettingsPage() {
    const { fetchFromTheme } = useTheme();
    const { user } = useAuth();
    const [selectedTheme, setSelectedTheme] = useState("blur");
    const [customThemes, setCustomThemes] = useState<Theme[]>([]);
    const [showEditor, setShowEditor] = useState(false);
    const [editorMode, setEditorMode] = useState<"normal" | "advanced" | "extra-advanced">(
        "normal",
    );

    useEffect(() => {
        // Load custom themes from localStorage
        const saved = localStorage.getItem("custom_themes");
        if (saved) {
            try {
                setCustomThemes(JSON.parse(saved));
            } catch (err) {
                console.error("Failed to load custom themes:", err);
            }
        }

        // Load selected theme
        const selectedThemeSaved = localStorage.getItem("selected_theme");
        if (selectedThemeSaved) {
            setSelectedTheme(selectedThemeSaved);
        }
    }, []);

    const handleThemeSelect = (themeId: string) => {
        setSelectedTheme(themeId);
        localStorage.setItem("selected_theme", themeId);
        fetchFromTheme(themeId);
    };

    const allThemes = [...BUILTIN_THEMES, ...customThemes];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-slate-800/80 backdrop-blur border-b border-slate-700">
                <div className="max-w-6xl mx-auto px-6 py-6">
                    <Link
                        href="/settings"
                        className="text-slate-400 hover:text-white mb-4 inline-block"
                    >
                        ← Back to Settings
                    </Link>
                    <div className="flex items-center gap-3 mb-2">
                        <Palette className="w-8 h-8 text-emerald-500" />
                        <h1 className="text-3xl font-bold text-white">Themes & Styles</h1>
                    </div>
                    <p className="text-slate-400">
                        Choose a theme or create custom styles for your schoolm8 experience
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-6 py-12">
                <div className="grid lg:grid-cols-3 gap-12">
                    {/* Left Column - Theme Selection */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Theme Selector */}
                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">Select Theme</h2>

                            <div className="space-y-3">
                                {allThemes.map((theme) => (
                                    <button
                                        key={theme.id}
                                        onClick={() => handleThemeSelect(theme.id)}
                                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                                            selectedTheme === theme.id
                                                ? "border-emerald-500 bg-emerald-500/10"
                                                : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                                        }`}
                                    >
                                        {/* Preview */}
                                        <div
                                            className={`h-20 rounded mb-3 bg-gradient-to-br ${theme.preview}`}
                                        />
                                        <h3 className="font-semibold text-white">{theme.name}</h3>
                                        <p className="text-sm text-slate-400">
                                            {theme.description}
                                        </p>
                                        {theme.isCustom && (
                                            <div className="mt-2 inline-block px-2 py-1 bg-purple-600/50 text-purple-200 text-xs rounded">
                                                Custom
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Quick Actions */}
                        <section>
                            <h3 className="text-lg font-semibold text-white mb-3">Quick Actions</h3>
                            <div className="space-y-2">
                                <button
                                    onClick={() => {
                                        setShowEditor(!showEditor);
                                        setEditorMode("normal");
                                    }}
                                    className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold flex items-center justify-center gap-2"
                                >
                                    <Palette className="w-4 h-4" />
                                    Edit Theme
                                </button>

                                <button className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors font-semibold flex items-center justify-center gap-2">
                                    <Download className="w-4 h-4" />
                                    Export Theme
                                </button>

                                <button className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors font-semibold flex items-center justify-center gap-2">
                                    <Share2 className="w-4 h-4" />
                                    Share (Coming Soon)
                                </button>
                            </div>
                        </section>
                    </div>

                    {/* Right Column - Editor or Info */}
                    <div className="lg:col-span-2">
                        {showEditor ? (
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-semibold text-white">
                                        Theme Editor
                                    </h2>
                                    <button
                                        onClick={() => setShowEditor(false)}
                                        className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                                <ThemeEditor initialMode={editorMode} />
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Current Theme Info */}
                                <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                                    <h2 className="text-2xl font-semibold text-white mb-4">
                                        {allThemes.find((t) => t.id === selectedTheme)?.name}
                                    </h2>
                                    <p className="text-slate-300 mb-4">
                                        {allThemes.find((t) => t.id === selectedTheme)?.description}
                                    </p>
                                    <button
                                        onClick={() => {
                                            setShowEditor(true);
                                            setEditorMode("advanced");
                                        }}
                                        className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
                                    >
                                        Customize This Theme
                                    </button>
                                </section>

                                {/* Theme Features */}
                                <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                                    <h3 className="text-xl font-semibold text-white mb-4">
                                        About Themes
                                    </h3>
                                    <div className="space-y-3 text-slate-300">
                                        <p>
                                            <strong>Built-in Themes:</strong> Pre-designed themes
                                            that come with schoolm8. These are optimized for
                                            readability and aesthetics.
                                        </p>
                                        <p>
                                            <strong>Custom Themes:</strong> Personalized themes you
                                            create using the theme editor. You can edit CSS and
                                            optionally JavaScript.
                                        </p>
                                        <p>
                                            <strong>Community Themes:</strong> Themes created by
                                            other schoolm8 users (coming soon).
                                        </p>
                                    </div>
                                </section>

                                {/* Theme Editor Modes */}
                                <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                                    <h3 className="text-xl font-semibold text-white mb-4">
                                        Editor Modes
                                    </h3>
                                    <div className="space-y-3 text-slate-300">
                                        <div>
                                            <p className="font-semibold text-white">Normal Mode</p>
                                            <p className="text-sm">
                                                Visual editor (currently a stub)
                                            </p>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white">
                                                Advanced Mode
                                            </p>
                                            <p className="text-sm">
                                                Edit custom CSS for any element
                                            </p>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white">
                                                Extra Advanced Mode
                                            </p>
                                            <p className="text-sm">
                                                Edit CSS and inject custom JavaScript
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                {/* Tips */}
                                <section className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-white mb-3">Tips</h3>
                                    <ul className="text-sm text-slate-300 space-y-2 list-disc list-inside">
                                        <li>
                                            Themes are saved to your account and sync across devices
                                        </li>
                                        <li>You can create multiple custom themes</li>
                                        <li>Extra Advanced Mode requires reauthentication</li>
                                        <li>Test changes carefully before saving</li>
                                    </ul>
                                </section>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
