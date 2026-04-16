"use client";

import { useNavigation, NavigationItem } from "@/context/navigationContext";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Trash2, Plus, GripVertical, Save } from "lucide-react";
import Link from "next/link";

export default function NavigationSettingsPage() {
    const {
        items,
        layout,
        setLayout,
        updateItem,
        removeItem,
        addItem,
        reorderItems,
        saveToDatabase,
    } = useNavigation();
    const [localItems, setLocalItems] = useState(items);
    const [localLayout, setLocalLayout] = useState(layout);
    const [saved, setSaved] = useState(false);
    const [draggedItem, setDraggedItem] = useState<string | null>(null);

    useEffect(() => {
        setLocalItems(items);
    }, [items]);

    const handleSave = async () => {
        // Update items in context
        const newItems = localItems.map((item, idx) => ({ ...item, order: idx }));
        newItems.forEach((item) => {
            updateItem(item.id, item);
        });

        // Update layout in context
        if (localLayout !== layout) {
            setLayout(localLayout);
        }

        // Save to database
        await saveToDatabase();

        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const handleToggleVisibility = (id: string) => {
        setLocalItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, visible: !item.visible } : item)),
        );
    };

    const handleRemove = (id: string) => {
        setLocalItems((prev) => prev.filter((item) => item.id !== id));
    };

    const handleDragStart = (id: string) => {
        setDraggedItem(id);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.currentTarget.classList.add("bg-emerald-500/20");
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove("bg-emerald-500/20");
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
        e.preventDefault();
        e.currentTarget.classList.remove("bg-emerald-500/20");

        if (!draggedItem || draggedItem === targetId) return;

        const draggedIndex = localItems.findIndex((item) => item.id === draggedItem);
        const targetIndex = localItems.findIndex((item) => item.id === targetId);

        if (draggedIndex < 0 || targetIndex < 0) return;

        const newItems = [...localItems];
        [newItems[draggedIndex], newItems[targetIndex]] = [
            newItems[targetIndex],
            newItems[draggedIndex],
        ];
        setLocalItems(newItems);
        setDraggedItem(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-slate-800/80 backdrop-blur border-b border-slate-700">
                <div className="max-w-4xl mx-auto px-6 py-6">
                    <Link
                        href="/settings"
                        className="text-slate-400 hover:text-white mb-4 inline-block"
                    >
                        ← Back to Settings
                    </Link>
                    <h1 className="text-3xl font-bold text-white">Navigation Customization</h1>
                    <p className="text-slate-400 mt-2">
                        Configure how your navigation appears across schoolm8
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                {/* Save Notification */}
                {saved && (
                    <div className="fixed bottom-8 right-8 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg animate-pulse">
                        ✓ Changes saved successfully!
                    </div>
                )}

                {/* Layout Selection */}
                <section className="mb-12">
                    <h2 className="text-2xl font-semibold text-white mb-4">Layout</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        {(["top", "sidebar", "hybrid"] as const).map((layoutType) => (
                            <button
                                key={layoutType}
                                onClick={() => setLocalLayout(layoutType)}
                                className={`p-6 rounded-lg border-2 transition-all text-left ${
                                    localLayout === layoutType
                                        ? "border-emerald-500 bg-emerald-500/10"
                                        : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                                }`}
                            >
                                <h3 className="font-semibold text-white capitalize mb-2">
                                    {layoutType} Layout
                                </h3>
                                <p className="text-sm text-slate-400">
                                    {layoutType === "top"
                                        ? "Navigation at the top of the page"
                                        : layoutType === "sidebar"
                                          ? "Collapsible sidebar navigation"
                                          : "Top bar + sidebar combination"}
                                </p>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Navigation Items */}
                <section className="mb-12">
                    <h2 className="text-2xl font-semibold text-white mb-4">Navigation Items</h2>
                    <div className="space-y-3">
                        {localItems.map((item) => (
                            <div
                                key={item.id}
                                draggable
                                onDragStart={() => handleDragStart(item.id)}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, item.id)}
                                className="flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-slate-600 transition-all cursor-move"
                            >
                                {/* Drag Handle */}
                                <GripVertical className="w-5 h-5 text-slate-500 flex-shrink-0" />

                                {/* Item Info */}
                                <div className="flex-1">
                                    <p className="font-semibold text-white">{item.label}</p>
                                    <p className="text-sm text-slate-400">{item.href}</p>
                                </div>

                                {/* Visibility Toggle */}
                                <button
                                    onClick={() => handleToggleVisibility(item.id)}
                                    className={`p-2 rounded-lg transition-colors ${
                                        item.visible
                                            ? "text-emerald-500 hover:bg-emerald-500/10"
                                            : "text-slate-500 hover:bg-slate-700"
                                    }`}
                                    title={item.visible ? "Hide" : "Show"}
                                >
                                    {item.visible ? (
                                        <Eye className="w-5 h-5" />
                                    ) : (
                                        <EyeOff className="w-5 h-5" />
                                    )}
                                </button>

                                {/* Remove Button */}
                                <button
                                    onClick={() => handleRemove(item.id)}
                                    className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="Remove"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Save Button */}
                <div className="flex gap-4">
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
                    >
                        <Save className="w-5 h-5" />
                        Save Changes
                    </button>

                    <Link
                        href="/settings"
                        className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors font-semibold"
                    >
                        Cancel
                    </Link>
                </div>

                {/* Info */}
                <div className="mt-12 p-6 bg-slate-800/30 border border-slate-700/50 rounded-lg">
                    <h3 className="font-semibold text-white mb-2">Tips:</h3>
                    <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
                        <li>Drag items to reorder navigation</li>
                        <li>Click the eye icon to show/hide items</li>
                        <li>Choose a layout that works best for you</li>
                        <li>Changes are automatically synced to your account</li>
                    </ul>
                </div>
            </main>
        </div>
    );
}
