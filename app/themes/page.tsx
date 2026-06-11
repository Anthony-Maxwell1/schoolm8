"use client";

import { useAuth } from "@/context/authContext";
import { useTheme } from "@/context/themeContext";
import { useCss } from "@/lib/css";
import { useEffect, useState } from "react";
import {
    Button,
    SearchInput,
    Modal,
    TextInput,
    Select,
    Badge,
    Chip,
    Alert,
    EmptyState,
    Skeleton,
    Text,
    Divider,
} from "@/components/ui/components";
import { Sparkles, TrendingUp, Clock, Download } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Theme card
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_BADGE: Record<string, { variant: "info" | "primary" | "warning" | "default"; label: string }> = {
    dashboard: { variant: "primary", label: "Dashboard" },
    website: { variant: "info", label: "Website" },
    tilepack: { variant: "warning", label: "Tilepack" },
    tile: { variant: "warning", label: "Tilepack" },
};

function ThemeCard({ theme, onClick }: { theme: any; onClick: () => void }) {
    const isNew = new Date(theme.created) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const isUpdated =
        !isNew && new Date(theme.updated) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const badge = TYPE_BADGE[theme.type] ?? TYPE_BADGE.dashboard;

    return (
        <button
            onClick={onClick}
            className="group flex flex-col gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 text-left shadow-[var(--shadow-sm)] transition-[transform,shadow] duration-[var(--duration-base)] ease-[var(--ease-spring)] hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-md)]"
        >
            <div className="flex items-start justify-between gap-2">
                <Text
                    variant="h5"
                    className="line-clamp-1 transition-colors group-hover:text-[var(--color-primary)]"
                >
                    {theme.name}
                </Text>
                <Badge variant={badge.variant} pill className="shrink-0 mt-0.5">
                    {badge.label}
                </Badge>
            </div>

            {theme.ownerName && (
                <Text variant="caption">by {theme.ownerName}</Text>
            )}

            {theme.description && (
                <Text variant="bodySm" className="line-clamp-2 flex-1">
                    {theme.description}
                </Text>
            )}

            <div className="mt-auto flex items-center gap-1.5">
                {isNew && (
                    <span className="flex items-center gap-1 text-xs text-[var(--color-success)]">
                        <Sparkles className="h-3 w-3" /> New
                    </span>
                )}
                {isUpdated && (
                    <span className="flex items-center gap-1 text-xs text-[var(--color-warning)]">
                        <Clock className="h-3 w-3" /> Updated
                    </span>
                )}
                {!isNew && !isUpdated && theme.installs != null && (
                    <span className="flex items-center gap-1 text-xs text-[var(--color-text-tertiary)]">
                        <Download className="h-3 w-3" /> {theme.installs}
                    </span>
                )}
            </div>
        </button>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton grid
// ─────────────────────────────────────────────────────────────────────────────

function ThemeGridSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <div
                    key={i}
                    className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 space-y-2"
                >
                    <Skeleton variant="text" width="70%" height={20} />
                    <Skeleton variant="text" width="40%" height={14} />
                    <Skeleton variant="text" lines={2} />
                </div>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section heading
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeading({ icon, title }: { icon: React.ReactNode; title: string }) {
    return (
        <div className="mb-5 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-subtle)] text-[var(--color-primary)]">
                {icon}
            </div>
            <Text variant="h3">{title}</Text>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

const FILTER_TYPES = [
    { key: "dashboard", label: "Dashboard" },
    { key: "website", label: "Website" },
    { key: "tilepack", label: "Tilepack" },
] as const;

const CREATE_TYPES = ["Dashboard Theme", "Website Theme", "Tilepack"] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function CommunityThemesPage() {
    const [popularThemes, setPopularThemes] = useState<any[]>([]);
    const [newThemes, setNewThemes] = useState<any[]>([]);
    const [recentUpdated, setRecentUpdated] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedTypeFilter, setSelectedTypeFilter] = useState<string | null>(null);
    const [initialLoading, setInitialLoading] = useState(true);

    // Create modal
    const [createOpen, setCreateOpen] = useState(false);
    const [createType, setCreateType] = useState<string | null>(null);
    const [themeName, setThemeName] = useState("");
    const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);

    // Detail modal
    const [popupTheme, setPopupTheme] = useState<any>(null);
    const [installing, setInstalling] = useState(false);
    const [installSuccess, setInstallSuccess] = useState(false);

    // Sanitization result modal
    const [sanitizationPopup, setSanitizationPopup] = useState<{
        nameSanitized: boolean;
        dataSanitized: boolean;
        newName?: string;
    } | null>(null);

    const { themes, tileThemes, addTheme, addTileTheme } = useCss();
    const { themes: themes_, setThemes } = useTheme();
    const { loading, token } = useAuth();

    // ── API helpers ───────────────────────────────────────────────────────
    function buildSearchUrl({
        count = 20, filter, filterOnly = false, query, filterData, extras,
    }: {
        count?: number; filter?: string; filterOnly?: boolean;
        query?: string; filterData?: string; extras?: Record<string, string | number | boolean>;
    }) {
        const params: Record<string, string> = { count: String(count) };
        if (filter) params.filter = filter;
        if (filterOnly) params.filterOnly = "true";
        if (filterData !== undefined) params.filterdata = String(filterData);
        if (!filterOnly && query) params.query = String(query);
        if (extras) Object.entries(extras).forEach(([k, v]) => (params[k] = String(v)));
        return `/api/themes/search?${new URLSearchParams(params)}`;
    }

    async function fetchThemes(opts: Parameters<typeof buildSearchUrl>[0]) {
        const res = await fetch(buildSearchUrl(opts));
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
    }

    // ── Initial load ──────────────────────────────────────────────────────
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const [popular, newData, recent] = await Promise.all([
                    fetchThemes({ count: 20, filter: "popular", filterOnly: true }),
                    fetchThemes({ count: 20, filter: "new", filterOnly: true }),
                    fetchThemes({ count: 20, filter: "recentUpdated", filterOnly: true }),
                ]);
                if (!mounted) return;
                setPopularThemes(popular);
                setNewThemes(newData);
                setRecentUpdated(recent);
            } catch (err) {
                console.error(err);
            } finally {
                if (mounted) setInitialLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, []);

    // ── Search ────────────────────────────────────────────────────────────
    async function search() {
        if (!searchQuery.trim()) { setSearchResults([]); return; }
        try {
            const results = await fetchThemes({
                count: 50, query: searchQuery,
                filter: selectedTypeFilter ?? undefined,
            });
            setSearchResults(results);
        } catch (err) {
            console.error(err);
        }
    }

    // ── Create ────────────────────────────────────────────────────────────
    async function handleCreate() {
        if (loading || !createType || !themeName.trim()) return;
        setCreating(true);
        try {
            const isDashboard = createType === "Dashboard Theme";
            const isWebsite = createType === "Website Theme";

            if (!isDashboard && !selectedTheme) return;

            const res = await fetch("/api/themes/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    type: isDashboard ? "dashboard" : isWebsite ? "website" : "tilepack",
                    name: themeName,
                    data: isDashboard
                        ? themes_["custom"] || {}
                        : isWebsite
                            ? themes[selectedTheme!] || {}
                            : tileThemes[selectedTheme!] || {},
                }),
            });
            if (!res.ok) throw new Error(`${res.status}`);
            const result = await res.json();

            if (result.nameGotSanitized || result.dataGotSanitized) {
                setSanitizationPopup({
                    nameSanitized: result.nameGotSanitized,
                    dataSanitized: result.dataGotSanitized,
                    newName: result.name || themeName,
                });
            }

            setCreateOpen(false);
            setThemeName("");
            setSelectedTheme(null);
            setCreateType(null);
        } catch (err) {
            console.error(err);
        } finally {
            setCreating(false);
        }
    }

    // ── Install ───────────────────────────────────────────────────────────
    function installTheme(theme: any) {
        setInstalling(true);
        const key = `${theme.name}-${Date.now()}`;
        if (theme.type === "dashboard") setThemes({ ...themes_, [key]: theme.data });
        else if (theme.type === "tile") addTileTheme(key, theme.data);
        else if (theme.type === "website") addTheme(key, theme.data);
        setInstalling(false);
        setInstallSuccess(true);
        setTimeout(() => { setInstallSuccess(false); setPopupTheme(null); }, 2000);
    }

    // ── Filter helper ─────────────────────────────────────────────────────
    const applyFilter = (list: any[]) =>
        selectedTypeFilter ? list.filter((t) => t.type === selectedTypeFilter) : list;

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[var(--color-surface)] px-6 py-16">
            <div className="mx-auto max-w-7xl">

                {/* ── Header ── */}
                <Text variant="label" className="mb-2 block">Community</Text>
                <h1 className="font-[family-name:var(--font-display)] text-[52px] leading-[1.05] tracking-[-0.02em] font-normal text-[var(--color-text-primary)]">
                    Theme <em>library</em>
                </h1>
                <Text variant="bodyLg" className="mt-3 text-[var(--color-text-secondary)]">
                    Browse, install, and share themes built by the Schoolm8 community.
                </Text>

                <Divider className="my-10" />

                {/* ── Toolbar ── */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end">
                    <div className="flex flex-1 gap-3">
                        <div className="flex-1">
                            <SearchInput
                                placeholder="Search themes…"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onClear={() => { setSearchQuery(""); setSearchResults([]); }}
                            />
                        </div>
                        <Button onClick={search}>Search</Button>
                    </div>
                    <Button
                        variant="secondary"
                        onClick={() => setCreateOpen(true)}
                    >
                        Publish a theme
                    </Button>
                </div>

                {/* ── Type filter chips ── */}
                <div className="mb-10 flex flex-wrap items-center gap-2">
                    <Chip
                        selected={selectedTypeFilter === null}
                        onClick={() => setSelectedTypeFilter(null)}
                    >
                        All
                    </Chip>
                    {FILTER_TYPES.map(({ key, label }) => (
                        <Chip
                            key={key}
                            selected={selectedTypeFilter === key}
                            onClick={() => setSelectedTypeFilter(key)}
                        >
                            {label}
                        </Chip>
                    ))}
                </div>

                {/* ── Search results ── */}
                {searchResults.length > 0 ? (
                    <section className="space-y-5">
                        <SectionHeading icon={<TrendingUp className="h-4 w-4" />} title="Search results" />
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {applyFilter(searchResults).map((theme: any) => (
                                <ThemeCard key={theme.id} theme={theme} onClick={() => setPopupTheme(theme)} />
                            ))}
                        </div>
                    </section>
                ) : (
                    <div className="space-y-14">

                        {/* Popular */}
                        <section>
                            <SectionHeading icon={<TrendingUp className="h-4 w-4" />} title="Popular" />
                            {initialLoading ? (
                                <ThemeGridSkeleton />
                            ) : applyFilter(popularThemes).length === 0 ? (
                                <EmptyState title="No popular themes yet" description="Check back soon." />
                            ) : (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    {applyFilter(popularThemes).map((t: any) => (
                                        <ThemeCard key={t.id} theme={t} onClick={() => setPopupTheme(t)} />
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* New */}
                        <section>
                            <SectionHeading icon={<Sparkles className="h-4 w-4" />} title="New" />
                            {initialLoading ? (
                                <ThemeGridSkeleton />
                            ) : applyFilter(newThemes).length === 0 ? (
                                <EmptyState title="No new themes yet" description="Be the first to publish one." />
                            ) : (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    {applyFilter(newThemes).map((t: any) => (
                                        <ThemeCard key={t.id} theme={t} onClick={() => setPopupTheme(t)} />
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Recently updated */}
                        <section>
                            <SectionHeading icon={<Clock className="h-4 w-4" />} title="Recently updated" />
                            {initialLoading ? (
                                <ThemeGridSkeleton />
                            ) : applyFilter(recentUpdated).length === 0 ? (
                                <EmptyState title="Nothing recently updated" />
                            ) : (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    {applyFilter(recentUpdated).map((t: any) => (
                                        <ThemeCard key={t.id} theme={t} onClick={() => setPopupTheme(t)} />
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </div>

            {/* ── Create modal ── */}
            <Modal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                title="Publish a theme"
                description="Share your theme with the Schoolm8 community."
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setCreateOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            loading={creating}
                            disabled={
                                !createType ||
                                !themeName.trim() ||
                                ((createType === "Website Theme" || createType === "Tilepack") && !selectedTheme)
                            }
                            onClick={handleCreate}
                        >
                            Publish
                        </Button>
                    </>
                }
            >
                <div className="space-y-5">
                    {/* Type selection */}
                    <div className="space-y-1.5">
                        <Text variant="label" className="block">Theme type</Text>
                        <div className="flex flex-wrap gap-2">
                            {CREATE_TYPES.map((type) => (
                                <Chip
                                    key={type}
                                    selected={createType === type}
                                    onClick={() => {
                                        setCreateType(type);
                                        setThemeName("");
                                        setSelectedTheme(null);
                                    }}
                                >
                                    {type}
                                </Chip>
                            ))}
                        </div>
                    </div>

                    {createType && (
                        <>
                            <TextInput
                                label={`Name (${themeName.length}/20)`}
                                placeholder="My custom theme"
                                maxLength={20}
                                value={themeName}
                                onChange={(e) => setThemeName(e.target.value)}
                            />

                            {createType === "Dashboard Theme" && (
                                <Text variant="caption">
                                    Your <strong>custom</strong> dashboard theme will be used.{" "}
                                    <a href="/settings/appearance" className="text-[var(--color-primary)] underline-offset-2 hover:underline">
                                        Edit it here
                                    </a>
                                </Text>
                            )}

                            {(createType === "Website Theme" || createType === "Tilepack") && (
                                <Select
                                    label="Source theme"
                                    value={selectedTheme ?? ""}
                                    onChange={(e) => setSelectedTheme(e.target.value)}
                                    options={[
                                        { value: "", label: "Choose a theme…" },
                                        ...(createType === "Website Theme"
                                            ? Object.keys(themes)
                                            : Object.keys(tileThemes)
                                        ).map((k) => ({ value: k, label: k })),
                                    ]}
                                />
                            )}
                        </>
                    )}
                </div>
            </Modal>

            {/* ── Sanitization result modal ── */}
            <Modal
                open={!!sanitizationPopup}
                onClose={() => setSanitizationPopup(null)}
                title="Theme published"
                footer={
                    <Button onClick={() => setSanitizationPopup(null)}>Got it</Button>
                }
            >
                <div className="space-y-3">
                    <Text variant="bodySm">Your theme was published, but some changes were made automatically:</Text>
                    {sanitizationPopup?.nameSanitized && (
                        <Alert
                            variant="warning"
                            title="Name was modified"
                            description={`Published as: ${sanitizationPopup.newName}`}
                        />
                    )}
                    {sanitizationPopup?.dataSanitized && (
                        <Alert
                            variant="warning"
                            title="Theme data was sanitized"
                            description="Some values were removed or modified to comply with community guidelines."
                        />
                    )}
                </div>
            </Modal>

            {/* ── Theme detail modal ── */}
            <Modal
                open={!!popupTheme}
                onClose={() => { setPopupTheme(null); setInstallSuccess(false); }}
                title={popupTheme?.name ?? ""}
                description={popupTheme?.ownerName ? `by ${popupTheme.ownerName}` : undefined}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => { setPopupTheme(null); setInstallSuccess(false); }}>
                            Close
                        </Button>
                        <Button
                            loading={installing}
                            onClick={() => installTheme(popupTheme)}
                            leftIcon={<Download className="h-4 w-4" />}
                        >
                            Install
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    {installSuccess && (
                        <Alert
                            variant="success"
                            title="Installed"
                            description={`Available in your theme library as "${popupTheme?.name}-…"`}
                        />
                    )}
                    <div className="flex items-center gap-2">
                        {popupTheme?.type && (
                            <Badge variant={TYPE_BADGE[popupTheme.type]?.variant ?? "default"} pill>
                                {TYPE_BADGE[popupTheme.type]?.label ?? popupTheme.type}
                            </Badge>
                        )}
                        {popupTheme?.installs != null && (
                            <Text variant="caption" className="flex items-center gap-1">
                                <Download className="h-3 w-3" /> {popupTheme.installs} installs
                            </Text>
                        )}
                    </div>
                    <Text variant="bodySm">
                        {popupTheme?.description ?? "No description available."}
                    </Text>
                </div>
            </Modal>
        </div>
    );
}