"use client";

import { useNavigation } from "@/context/navigationContext";
import { Link as LucidLink, Trash } from "lucide-react";
import Link from "next/link";
import { createElement, useState } from "react";

const backgroundImage = "/images/backgrounds/builtin/onboarding.png";

export default function NavigationSettings() {
    const { setItems, items, ICON_MAP, DEFAULT_ITEMS } = useNavigation();
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const updateItem = (
        index: number,
        patch: Partial<{ label: string; icon: string; visible: boolean; href: string }>,
    ) => {
        setItems(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
    };

    const removeItem = (index: number) => {
        if (!confirm("Are you sure you want to delete this navigation item?")) return;
        setItems(items.filter((_, i) => i !== index));
        if (openIndex === index) setOpenIndex(null);
    };

    return (
        <div
            className="relative min-h-screen bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImage})`, backgroundAttachment: "fixed" }}
        >
            <div className="absolute inset-0 bg-linear-to-b from-black/45 via-black/35 to-black/60 backdrop-blur-sm" />

            <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
                <div className="w-full max-w-3xl rounded-3xl ring-1 ring-white/30 bg-white/15 backdrop-blur-xl shadow-2xl overflow-hidden">
                    <header className="px-6 py-5 border-b border-white/20">
                        <h1 className="text-2xl font-semibold text-white">Navigation Settings</h1>
                        <p className="text-sm text-white/80 mt-1">
                            Edit labels/icons and collapse each item for a cleaner view.
                        </p>
                    </header>

                    <details className="bg-white/10 m-4 rounded-xl overflow-hidden">
                        <summary className="cursor-pointer text-center w-full bg-blue-500 text-white py-4 px-4">
                            Navigation Items
                        </summary>
                        {items.length === 0 && (
                            <div className="rounded-xl border border-white/20 bg-white/10 p-4 text-white/80 text-sm">
                                No navigation items.
                            </div>
                        )}

                        <div className="p-4 space-y-3">
                            {items.map((item, index) => {
                                const isOpen = openIndex === index;

                                return (
                                    <div
                                        key={index}
                                        className="rounded-xl border border-white/20 bg-white/10 overflow-hidden"
                                    >
                                        <button
                                            onClick={() =>
                                                setOpenIndex((prev) =>
                                                    prev === index ? null : index,
                                                )
                                            }
                                            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/10 transition"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">
                                                    {item.icon && ICON_MAP[item.icon]
                                                        ? createElement(ICON_MAP[item.icon], {
                                                              className: "w-5 h-5 text-white/80",
                                                          })
                                                        : "🔹"}
                                                </span>
                                                <div>
                                                    <p className="text-white font-medium">
                                                        {item.label || `Item ${index + 1}`}
                                                    </p>
                                                    <p className="text-xs text-white/70">
                                                        {item.visible ? "Visible" : "Hidden"}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-white/80 text-sm">
                                                {isOpen ? "Hide" : "Edit"}
                                            </span>
                                        </button>

                                        {isOpen && (
                                            <div className="px-4 pb-4 pt-1 border-t border-white/15 space-y-3">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <label className="flex flex-col gap-1">
                                                        <span className="text-xs text-white/80">
                                                            Icon
                                                        </span>
                                                        <input
                                                            className="rounded-lg bg-black/25 border border-white/20 text-white px-3 py-2 outline-none focus:ring-2 focus:ring-white/40"
                                                            value={item.icon}
                                                            onChange={(e) =>
                                                                updateItem(index, {
                                                                    icon: e.target.value,
                                                                })
                                                            }
                                                            placeholder="Home"
                                                        />
                                                    </label>

                                                    <label className="flex flex-col gap-1">
                                                        <span className="text-xs text-white/80">
                                                            Label
                                                        </span>
                                                        <input
                                                            className="rounded-lg bg-black/25 border border-white/20 text-white px-3 py-2 outline-none focus:ring-2 focus:ring-white/40"
                                                            value={item.label}
                                                            onChange={(e) =>
                                                                updateItem(index, {
                                                                    label: e.target.value,
                                                                })
                                                            }
                                                            placeholder="Home"
                                                        />
                                                    </label>
                                                </div>
                                                <label className="flex flex-col gap-1">
                                                    <span className="text-xs text-white/80">
                                                        Href
                                                    </span>
                                                    <input
                                                        className="rounded-lg bg-black/25 border border-white/20 text-white px-3 py-2 outline-none focus:ring-2 focus:ring-white/40"
                                                        value={item.href}
                                                        onChange={(e) =>
                                                            updateItem(index, {
                                                                href: e.target.value,
                                                            })
                                                        }
                                                        placeholder="/home"
                                                    />
                                                </label>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() =>
                                                            updateItem(index, {
                                                                visible: !item.visible,
                                                            })
                                                        }
                                                        className={`px-3 py-2 rounded-lg text-sm font-medium text-white transition ${
                                                            item.visible
                                                                ? "bg-emerald-500 hover:bg-emerald-600"
                                                                : "bg-gray-500 hover:bg-gray-600"
                                                        }`}
                                                    >
                                                        {item.visible ? "Visible" : "Hidden"}
                                                    </button>

                                                    <button
                                                        onClick={() => removeItem(index)}
                                                        className="px-3 py-2 rounded-lg text-sm font-medium text-white bg-rose-500 hover:bg-rose-600 transition"
                                                    >
                                                        Remove
                                                    </button>
                                                    {item.children && item.children.length > 0 && (
                                                        <button
                                                            onClick={() => {
                                                                const newItems = [...items];
                                                                newItems[index].collapsible =
                                                                    !newItems[index].collapsible;
                                                                setItems(newItems);
                                                            }}
                                                            className="ml-auto px-3 py-2 rounded-lg text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 transition"
                                                        >
                                                            {items[index].collapsible
                                                                ? "Expandable"
                                                                : "Unexpandable"}
                                                        </button>
                                                    )}
                                                </div>
                                                {item.children && (
                                                    <div className="mt-3 pl-4 border-l border-white/20">
                                                        <p className="text-xs text-white/80 mb-2">
                                                            Sub-items
                                                        </p>
                                                        {item.children.map((child, childIndex) => (
                                                            <div
                                                                key={childIndex}
                                                                className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10 transition"
                                                            >
                                                                <button
                                                                    className="flex items-center gap-2 bg-red-500/80 p-2 rounded-md"
                                                                    onClick={() => {
                                                                        if (
                                                                            confirm(
                                                                                "Are you sure you want to delete this sub-item?",
                                                                            )
                                                                        ) {
                                                                            const newItems = [
                                                                                ...items,
                                                                            ];
                                                                            newItems[
                                                                                index
                                                                            ].children!.splice(
                                                                                childIndex,
                                                                                1,
                                                                            );
                                                                            setItems(newItems);
                                                                        }
                                                                    }}
                                                                >
                                                                    <Trash className="w-3.5 h-3.5 text-white/80 cursor-pointer" />
                                                                </button>
                                                                {/* Icon */}
                                                                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-black/30">
                                                                    {child.icon &&
                                                                    ICON_MAP[child.icon] ? (
                                                                        createElement(
                                                                            ICON_MAP[child.icon],
                                                                            {
                                                                                className:
                                                                                    "w-4 h-4 text-white/80",
                                                                            },
                                                                        )
                                                                    ) : (
                                                                        <span className="text-sm">
                                                                            🔹
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {/* Inputs */}
                                                                <div className="flex flex-1 items-center gap-2">
                                                                    <input
                                                                        type="text"
                                                                        value={child.icon}
                                                                        onChange={(e) => {
                                                                            const newItems = [
                                                                                ...items,
                                                                            ];
                                                                            newItems[
                                                                                index
                                                                            ].children![
                                                                                childIndex
                                                                            ].icon = e.target.value;
                                                                            setItems(newItems);
                                                                        }}
                                                                        placeholder="Icon"
                                                                        className="w-20 rounded-md bg-black/30 border border-white/10 px-2 py-1 text-xs text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/40"
                                                                    />

                                                                    <input
                                                                        type="text"
                                                                        value={child.label}
                                                                        onChange={(e) => {
                                                                            const newItems = [
                                                                                ...items,
                                                                            ];
                                                                            newItems[
                                                                                index
                                                                            ].children![
                                                                                childIndex
                                                                            ].label =
                                                                                e.target.value;
                                                                            setItems(newItems);
                                                                        }}
                                                                        placeholder="Label"
                                                                        className="flex-1 rounded-md bg-black/30 border border-white/10 px-2 py-1 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/40"
                                                                    />
                                                                </div>

                                                                {/* Visibility toggle */}
                                                                <label className="flex items-center gap-2 text-xs text-white/80 cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={child.visible}
                                                                        onChange={(e) => {
                                                                            const newItems = [
                                                                                ...items,
                                                                            ];
                                                                            newItems[
                                                                                index
                                                                            ].children![
                                                                                childIndex
                                                                            ].visible =
                                                                                e.target.checked;
                                                                            setItems(newItems);
                                                                        }}
                                                                        className="accent-emerald-500 cursor-pointer"
                                                                    />
                                                                    Visible
                                                                </label>
                                                            </div>
                                                        ))}
                                                        <button
                                                            onClick={() => {
                                                                const newItems = [...items];
                                                                newItems[index].children!.push({
                                                                    id: `child-${Date.now()}`,
                                                                    icon: "",
                                                                    label: "New Sub-item",
                                                                    visible: true,
                                                                    href: "#",
                                                                });
                                                                setItems(newItems);
                                                            }}
                                                            className="mt-2 px-3 py-2 rounded-lg text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 transition"
                                                        >
                                                            Add Sub-item
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <button
                            onClick={() =>
                                setItems([
                                    ...items,
                                    {
                                        id: `item-${Date.now()}`,
                                        label: "New Item",
                                        href: "#",
                                        visible: true,
                                    },
                                ])
                            }
                            className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium transition"
                        >
                            Add Item
                        </button>
                    </details>
                    <button
                        className="w-full px-4 py-3 bg-rose-500 hover:bg-rose-600 text-white font-medium transition"
                        onClick={() => {
                            if (
                                confirm(
                                    "Are you sure you want to reset the navigation to its default state?",
                                )
                            ) {
                                setItems(DEFAULT_ITEMS);
                            }
                        }}
                    >
                        Reset to default
                    </button>
                    <Link
                        href="/settings/appearance"
                        className="flex items-center justify-center gap-2 w-full bg-blue-500 hover:bg-blue-600 text-white py-4 transition"
                    >
                        <LucidLink className="w-5 h-5" />
                        <span>Edit Appearance of navigation here.</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
