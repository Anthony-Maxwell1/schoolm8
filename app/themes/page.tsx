"use client";
import React, { useState, useEffect, useMemo } from "react";

// --- MOCK API & DATA ---
const TYPE_LABELS = {
    css: "Website theme",
    theme: "Dashboard theme",
    tiles: "Tile Themepack",
};

const INITIAL_DATA = [
    {
        id: 1,
        name: "Midnight Neon",
        type: "css",
        author: "DevAlex",
        downloads: 1240,
        createdAt: "2026-04-20",
        data: { primary: "#0f0", bg: "#000" },
    },
    {
        id: 2,
        name: "Enterprise Blue",
        type: "theme",
        author: "CorpDesign",
        downloads: 850,
        createdAt: "2026-04-25",
        data: { font: "Inter", spacing: "compact" },
    },
    {
        id: 3,
        name: "Retro Console",
        type: "tiles",
        author: "PixelArt",
        downloads: 300,
        createdAt: "2026-04-27",
        data: { shape: "pixel", scale: 2 },
    },
    {
        id: 4,
        name: "Solarized Light",
        type: "css",
        author: "EthanH",
        downloads: 2100,
        createdAt: "2026-04-10",
        data: { theme: "solar" },
    },
    {
        id: 5,
        name: "Glassmorphism UI",
        type: "theme",
        author: "UI_Master",
        downloads: 5000,
        createdAt: "2026-04-28",
        data: { blur: "10px" },
    },
];

const mockApi = {
    fetchThemes: () => Promise.resolve(INITIAL_DATA),
    createTheme: (theme: any) =>
        Promise.resolve({
            ...theme,
            id: Date.now(),
            downloads: 0,
            createdAt: new Date().toISOString(),
        }),
};

// --- COMPONENTS ---

const ThemeCard = ({
    theme,
    variant = "vertical",
}: {
    theme: any;
    variant?: "vertical" | "horizontal";
}) => (
    <div
        className={`flex-shrink-0 bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow ${variant === "vertical" ? "w-64" : "w-full mb-3 flex justify-between items-center"}`}
    >
        <div>
            <h4 className="font-bold text-slate-800">{theme.name}</h4>
            <p className="text-xs text-slate-500 mb-2">by {theme.author}</p>
            <span className="inline-block px-2 py-1 rounded bg-indigo-50 text-indigo-600 text-[10px] font-semibold uppercase tracking-wider">
                {TYPE_LABELS[theme.type as keyof typeof TYPE_LABELS]}
            </span>
        </div>
        <div className="text-right">
            <p className="text-xs font-medium text-slate-400">
                {theme.downloads.toLocaleString()} installs
            </p>
        </div>
    </div>
);

const SectionShelf = ({ title, themes }: { title: string; themes: any[] }) => (
    <section className="mb-10">
        <h3 className="text-lg font-bold text-slate-800 mb-4 px-1">{title}</h3>
        <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
            {themes.map((t) => (
                <ThemeCard key={t.id} theme={t} />
            ))}
        </div>
    </section>
);

export default function CommunityThemesPage() {
    const [themes, setThemes] = useState([]);
    const [search, setSearch] = useState("");
    const [activeFilter, setActiveFilter] = useState("all");
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        mockApi.fetchThemes().then(setThemes as (themes: any[]) => void);
    }, []);

    // Filter & Search Logic
    const filteredThemes = useMemo(() => {
        return themes.filter((t: any) => {
            const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
            const matchesFilter = activeFilter === "all" || t.type === activeFilter;
            return matchesSearch && matchesFilter;
        });
    }, [themes, search, activeFilter]);

    // Sorting for Shelves
    const popularThemes = [...themes].sort((a: any, b: any) => b.downloads - a.downloads);
    const newThemes = [...themes].sort(
        (a: any, b: any) => (new Date(b.createdAt) as any) - (new Date(a.createdAt) as any),
    );

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
            {/* Header */}
            <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">
                        Community Themes
                    </h1>
                    <p className="text-slate-500">Discover and share custom configurations.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-200"
                >
                    + Create Theme
                </button>
            </header>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Sidebar: Filters */}
                <aside className="lg:col-span-3 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h2 className="font-bold mb-4 text-sm uppercase tracking-widest text-slate-400">
                            Search & Filter
                        </h2>
                        <input
                            type="text"
                            placeholder="Search themes..."
                            className="w-full mb-4 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <nav className="flex flex-col gap-1">
                            {["all", "css", "theme", "tiles"].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setActiveFilter(f)}
                                    className={`text-left px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${activeFilter === f ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}
                                >
                                    {f === "all"
                                        ? "All Themes"
                                        : TYPE_LABELS[f as keyof typeof TYPE_LABELS]}
                                </button>
                            ))}
                        </nav>
                    </div>
                </aside>

                {/* Main Feed */}
                <main className="lg:col-span-9">
                    <div className="mb-12">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            Recent Activity
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        </h2>
                        <div className="space-y-3">
                            {filteredThemes.length > 0 ? (
                                filteredThemes.map((t: any) => (
                                    <ThemeCard key={t.id} theme={t} variant="horizontal" />
                                ))
                            ) : (
                                <div className="py-20 text-center text-slate-400 italic bg-white rounded-2xl border-2 border-dashed border-slate-200">
                                    No themes found matching your criteria.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Scrolling Shelves */}
                    <SectionShelf title="Most Popular" themes={popularThemes} />
                    <SectionShelf title="Recently Added" themes={newThemes} />
                    <SectionShelf title="Trending Now" themes={themes} />
                </main>
            </div>

            {/* Basic Create Modal Stub */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                        <h2 className="text-2xl font-bold mb-4">Create New Theme</h2>
                        <p className="text-slate-500 mb-6 text-sm">
                            Fill in your theme details. Data field accepts valid JSON.
                        </p>
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Theme Name"
                                className="w-full px-4 py-2 border rounded-lg"
                            />
                            <select className="w-full px-4 py-2 border rounded-lg">
                                <option value="css">Website Theme</option>
                                <option value="theme">Dashboard Theme</option>
                                <option value="tiles">Tile Themepack</option>
                            </select>
                            <textarea
                                placeholder='{"color": "#ffffff"}'
                                className="w-full px-4 py-2 border rounded-lg h-32 font-mono text-sm"
                            />
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 border rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium"
                                >
                                    Publish
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
