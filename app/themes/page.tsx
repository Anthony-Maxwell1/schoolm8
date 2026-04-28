"use client";

import { useEffect, useState } from "react";

export default function CommunityThemesPage() {
    const [popularThemes, setPopularThemes] = useState([]);
    const [newThemes, setNewThemes] = useState([]);
    const [recentUpdated, setRecentUpdated] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTypeFilter, setSelectedTypeFilter] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createType, setCreateType] = useState<"Dashboard Theme" | "Website Theme" | "Tilepack" | null>(null);
    const [themeName, setThemeName] = useState("");
    const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
    const [sanitizationPopup, setSanitizationPopup] = useState<{
        nameSanitized: boolean;
        dataSanitized: boolean;
        newName?: string;
    } | null>(null);
    // Helper to build the search URL according to the rules:
    // - count: number to fetch
    // - filter: one of popular | new | recentUpdated | type
    // - filterOnly: when true, don't include `query`
    // - query: free text search
    // - filterData: used when filter=type (goes as filterdata=value)
    // - extras: object of additional key/value filters appended as query params
    function buildSearchUrl({
        count = 20,
        filter,
        filterOnly = false,
        query,
        filterData,
        extras,
    }: {
        count?: number;
        filter?: string;
        filterOnly?: boolean;
        query?: string;
        filterData?: string;
        extras?: Record<string, string | number | boolean>;
    }) {
        const params: Record<string, string> = { count: String(count) };
        if (filter) params.filter = filter;
        if (filterOnly) params.filterOnly = "true";
        if (typeof filterData !== "undefined") params.filterdata = String(filterData);
        if (!filterOnly && query) params.query = String(query);
        if (extras) {
            for (const [k, v] of Object.entries(extras)) {
                params[k] = String(v);
            }
        }
        const qs = new URLSearchParams(params).toString();
        return `/api/themes/search?${qs}`;
    }

    async function fetchThemesWithOptions(opts: Parameters<typeof buildSearchUrl>[0]) {
        const url = buildSearchUrl(opts as any);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
        return res.json();
    }

    // Simple search handler: runs a general search using `query` and populates the
    // "Popular" section with the returned results. The API supports pairing
    // query with filters if needed by passing a filter in opts.
    async function search() {
        try {
            if (!searchQuery) return;
            const results = await fetchThemesWithOptions({ count: 50, query: searchQuery });
            setPopularThemes(results);
        } catch (err) {
            console.error(err);
            alert("Error fetching search results.");
        }
    }

    async function handleCreateTheme() {
        try {
            if (!createType) return;

            if (createType === "Dashboard Theme") {
                if (!themeName.trim()) {
                    alert("Please enter a theme name");
                    return;
                }
                // Stub: pretend we created it with sanitization
                const newName = themeName.replace(/[^a-zA-Z0-9 ]/g, "");
                setSanitizationPopup({
                    nameSanitized: newName !== themeName,
                    dataSanitized: true,
                    newName: newName || themeName,
                });
            } else {
                if (!selectedTheme) {
                    alert("Please select a theme");
                    return;
                }
                // Stub: pretend we created it with sanitization
                setSanitizationPopup({
                    nameSanitized: true,
                    dataSanitized: true,
                    newName: selectedTheme,
                });
            }

            // Reset form after a short delay
            setTimeout(() => {
                setThemeName("");
                setSelectedTheme(null);
                setCreateType(null);
                setIsCreateModalOpen(false);
            }, 2000);
        } catch (err) {
            console.error(err);
            alert("Error creating theme.");
        }
    }

    useEffect(() => {
        let mounted = true;
        async function load() {
            try {
                const [popularData, newData, recentData] = await Promise.all([
                    fetchThemesWithOptions({ count: 20, filter: "popular", filterOnly: true }),
                    fetchThemesWithOptions({ count: 20, filter: "new", filterOnly: true }),
                    fetchThemesWithOptions({
                        count: 20,
                        filter: "recentUpdated",
                        filterOnly: true,
                    }),
                ]);
                if (!mounted) return;
                setPopularThemes(popularData);
                setNewThemes(newData);
                setRecentUpdated(recentData);
            } catch (err) {
                console.error(err);
                alert("Error fetching themes.");
            }
        }
        load();
        return () => {
            mounted = false;
        };
    }, []);
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-12">
                <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Community Themes
                </h1>
                <p className="text-slate-300 text-lg">
                    Browse, create, and customize themes for your dashboard
                </p>
            </div>

            {/* Search and Filter Section */}
            <div className="max-w-7xl mx-auto mb-12">
                <div className="flex gap-4 flex-col md:flex-row mb-6">
                    <div className="flex-1">
                        <input
                            placeholder="Search themes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                        />
                    </div>
                    <button
                        onClick={search}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg font-semibold transition transform hover:scale-105"
                    >
                        Search
                    </button>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-lg font-semibold transition transform hover:scale-105"
                    >
                        Create Theme
                    </button>
                </div>

                {/* Type Filter */}
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <p className="text-sm font-semibold text-slate-300 mb-3">Filter by Type</p>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() =>
                                setSelectedTypeFilter(
                                    selectedTypeFilter === null ? null : null
                                )
                            }
                            className={`px-4 py-2 rounded-lg font-medium transition ${
                                selectedTypeFilter === null
                                    ? "bg-blue-600 text-white"
                                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                            }`}
                        >
                            All
                        </button>
                        {["Website Theme", "Tilepack", "Dashboard Theme"].map((type) => (
                            <button
                                key={type}
                                onClick={() =>
                                    setSelectedTypeFilter(
                                        selectedTypeFilter === type ? null : type
                                    )
                                }
                                className={`px-4 py-2 rounded-lg font-medium transition ${
                                    selectedTypeFilter === type
                                        ? "bg-blue-600 text-white"
                                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                                }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Theme Sections */}
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Popular Section */}
                <section>
                    <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
                        <span className="w-1 h-8 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full"></span>
                        Popular Themes
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {popularThemes.length > 0 ? (
                            popularThemes.map((theme: any) => (
                                <button
                                    key={theme.id}
                                    className="bg-slate-800 border border-slate-700 rounded-lg p-5 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 transition group"
                                >
                                    <h3 className="font-bold text-lg group-hover:text-blue-400 transition">
                                        {theme.name}
                                    </h3>
                                    <p className="text-slate-400 text-sm mt-2 line-clamp-2">
                                        {theme.description}
                                    </p>
                                    {theme.install && (
                                        <p className="text-xs text-slate-500 mt-3">
                                            📥 {theme.install} installs
                                        </p>
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12">
                                <p className="text-slate-400">No popular themes yet</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* New Section */}
                <section>
                    <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
                        <span className="w-1 h-8 bg-gradient-to-b from-green-400 to-green-600 rounded-full"></span>
                        New Themes
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {newThemes.length > 0 ? (
                            newThemes.map((theme: any) => (
                                <button
                                    key={theme.id}
                                    className="bg-slate-800 border border-slate-700 rounded-lg p-5 hover:border-green-500 hover:shadow-lg hover:shadow-green-500/20 transition group"
                                >
                                    <h3 className="font-bold text-lg group-hover:text-green-400 transition">
                                        {theme.name}
                                    </h3>
                                    <p className="text-slate-400 text-sm mt-2 line-clamp-2">
                                        {theme.description}
                                    </p>
                                    {theme.created && (
                                        <p className="text-xs text-slate-500 mt-3">
                                            ✨ Recently added
                                        </p>
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12">
                                <p className="text-slate-400">No new themes yet</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Recently Updated Section */}
                <section>
                    <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
                        <span className="w-1 h-8 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full"></span>
                        Recently Updated
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {recentUpdated.length > 0 ? (
                            recentUpdated.map((theme: any) => (
                                <button
                                    key={theme.id}
                                    className="bg-slate-800 border border-slate-700 rounded-lg p-5 hover:border-orange-500 hover:shadow-lg hover:shadow-orange-500/20 transition group"
                                >
                                    <h3 className="font-bold text-lg group-hover:text-orange-400 transition">
                                        {theme.name}
                                    </h3>
                                    <p className="text-slate-400 text-sm mt-2 line-clamp-2">
                                        {theme.description}
                                    </p>
                                    {theme.updated && (
                                        <p className="text-xs text-slate-500 mt-3">
                                            🔄 Updated recently
                                        </p>
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12">
                                <p className="text-slate-400">No recently updated themes</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Create Theme Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-800 rounded-lg border border-slate-700 max-w-md w-full p-8 shadow-xl">
                        <h2 className="text-2xl font-bold mb-6">Create Theme</h2>

                        {/* Type Selection */}
                        <div className="mb-6">
                            <label className="block text-sm font-semibold mb-3 text-slate-300">
                                Theme Type
                            </label>
                            <div className="space-y-2">
                                {(["Dashboard Theme", "Website Theme", "Tilepack"] as const).map(
                                    (type) => (
                                        <button
                                            key={type}
                                            onClick={() => {
                                                setCreateType(type);
                                                setThemeName("");
                                                setSelectedTheme(null);
                                            }}
                                            className={`w-full px-4 py-3 rounded-lg font-medium border transition text-left ${
                                                createType === type
                                                    ? "bg-blue-600 border-blue-500 text-white"
                                                    : "bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600"
                                            }`}
                                        >
                                            {type}
                                        </button>
                                    )
                                )}
                            </div>
                        </div>

                        {/* Conditional Content Based on Type */}
                        {createType === "Dashboard Theme" && (
                            <div className="mb-6">
                                <label className="block text-sm font-semibold mb-2 text-slate-300">
                                    Theme Name ({themeName.length}/20)
                                </label>
                                <input
                                    type="text"
                                    maxLength={20}
                                    value={themeName}
                                    onChange={(e) => setThemeName(e.target.value)}
                                    placeholder="My Custom Theme"
                                    className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                />
                                <p className="text-xs text-slate-400 mt-2">
                                    Your custom theme will be used for your personal dashboard.
                                </p>
                            </div>
                        )}

                        {(createType === "Website Theme" || createType === "Tilepack") && (
                            <div className="mb-6">
                                <label className="block text-sm font-semibold mb-2 text-slate-300">
                                    Select Theme
                                </label>
                                <select
                                    value={selectedTheme || ""}
                                    onChange={(e) => setSelectedTheme(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                >
                                    <option value="">Choose a theme...</option>
                                    {(createType === "Website Theme"
                                        ? newThemes
                                        : recentUpdated
                                    ).map((theme: any) => (
                                        <option key={theme.id} value={theme.id}>
                                            {theme.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="flex-1 px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 font-semibold transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateTheme}
                                disabled={
                                    !createType ||
                                    (createType === "Dashboard Theme" && !themeName.trim()) ||
                                    ((createType === "Website Theme" ||
                                        createType === "Tilepack") &&
                                        !selectedTheme)
                                }
                                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold transition"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sanitization Popup */}
            {sanitizationPopup && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-800 rounded-lg border border-slate-700 max-w-md w-full p-8 shadow-xl">
                        <h3 className="text-xl font-bold mb-4">Theme Created</h3>
                        <div className="space-y-3 mb-6">
                            {sanitizationPopup.nameSanitized && (
                                <div className="bg-amber-900/30 border border-amber-700 rounded p-3">
                                    <p className="text-sm text-amber-200">
                                        <span className="font-semibold">Name got sanitized:</span>
                                    </p>
                                    <p className="text-sm text-amber-100 mt-1 font-mono">
                                        {sanitizationPopup.newName}
                                    </p>
                                </div>
                            )}
                            {sanitizationPopup.dataSanitized && (
                                <div className="bg-amber-900/30 border border-amber-700 rounded p-3">
                                    <p className="text-sm text-amber-200">
                                        <span className="font-semibold">Data got sanitized</span>
                                    </p>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => setSanitizationPopup(null)}
                            className="w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
