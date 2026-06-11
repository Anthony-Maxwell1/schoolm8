"use client";

import { useNavigation } from "@/context/navigationContext";
import { Trash, ChevronDown, ChevronRight, GripVertical } from "lucide-react";
import Link from "next/link";
import { createElement, useState } from "react";
import {
    Button,
    Text,
    Divider,
    Alert,
    Badge,
    Toggle,
    TextInput,
} from "@/components/ui/components";

// ─────────────────────────────────────────────────────────────────────────────
// Sub-item row
// ─────────────────────────────────────────────────────────────────────────────

function SubItemRow({
    child,
    onIconChange,
    onLabelChange,
    onVisibleChange,
    onRemove,
}: {
    child: any;
    onIconChange: (v: string) => void;
    onLabelChange: (v: string) => void;
    onVisibleChange: (v: boolean) => void;
    onRemove: () => void;
}) {
    return (
        <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2.5">
            <GripVertical className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-disabled)]" />
            <input
                type="text"
                value={child.icon}
                onChange={(e) => onIconChange(e.target.value)}
                placeholder="Icon"
                className="w-16 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-2 py-1 text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
            />
            <input
                type="text"
                value={child.label}
                onChange={(e) => onLabelChange(e.target.value)}
                placeholder="Label"
                className="flex-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-2 py-1 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
            />
            <label className="flex items-center gap-1.5 cursor-pointer text-xs text-[var(--color-text-secondary)] shrink-0">
                <input
                    type="checkbox"
                    checked={child.visible}
                    onChange={(e) => onVisibleChange(e.target.checked)}
                    className="accent-[var(--color-success)] cursor-pointer"
                />
                Visible
            </label>
            <button
                type="button"
                onClick={onRemove}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-danger)]/80 text-white transition-opacity hover:opacity-90"
                aria-label="Remove sub-item"
            >
                <Trash className="h-3 w-3" />
            </button>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Nav item accordion row
// ─────────────────────────────────────────────────────────────────────────────

function NavItemRow({
    item,
    index,
    isOpen,
    onToggle,
    onUpdate,
    onRemove,
    onAddChild,
    onRemoveChild,
    onUpdateChild,
    onToggleCollapsible,
    ICON_MAP,
}: {
    item: any;
    index: number;
    isOpen: boolean;
    onToggle: () => void;
    onUpdate: (patch: any) => void;
    onRemove: () => void;
    onAddChild: () => void;
    onRemoveChild: (childIndex: number) => void;
    onUpdateChild: (childIndex: number, patch: any) => void;
    onToggleCollapsible: () => void;
    ICON_MAP: Record<string, any>;
}) {
    return (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-raised)]">
            {/* Header row */}
            <button
                onClick={onToggle}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--color-muted)]"
            >
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-subtle)]">
                        {item.icon && ICON_MAP[item.icon]
                            ? createElement(ICON_MAP[item.icon], { className: "w-4 h-4 text-[var(--color-primary)]" })
                            : <span className="text-sm">🔹</span>
                        }
                    </div>
                    <div>
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">
                            {item.label || `Item ${index + 1}`}
                        </p>
                        <p className="text-xs text-[var(--color-text-tertiary)]">{item.href}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={item.visible ? "success" : "default"}>
                        {item.visible ? "Visible" : "Hidden"}
                    </Badge>
                    {isOpen
                        ? <ChevronDown className="h-4 w-4 text-[var(--color-text-tertiary)]" />
                        : <ChevronRight className="h-4 w-4 text-[var(--color-text-tertiary)]" />
                    }
                </div>
            </button>

            {/* Expanded body */}
            {isOpen && (
                <div className="border-t border-[var(--color-border-subtle)] px-4 pb-4 pt-4 space-y-4">
                    {/* Fields */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-medium tracking-[0.1em] uppercase text-[var(--color-text-tertiary)]">Icon</span>
                            <input
                                className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
                                value={item.icon}
                                onChange={(e) => onUpdate({ icon: e.target.value })}
                                placeholder="Home"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-medium tracking-[0.1em] uppercase text-[var(--color-text-tertiary)]">Label</span>
                            <input
                                className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
                                value={item.label}
                                onChange={(e) => onUpdate({ label: e.target.value })}
                                placeholder="Home"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-medium tracking-[0.1em] uppercase text-[var(--color-text-tertiary)]">Href</span>
                        <input
                            className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
                            value={item.href}
                            onChange={(e) => onUpdate({ href: e.target.value })}
                            placeholder="/home"
                        />
                    </div>

                    {/* Controls row */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <Button
                            size="sm"
                            variant={item.visible ? "success" : "outline"}
                            onClick={() => onUpdate({ visible: !item.visible })}
                        >
                            {item.visible ? "Visible" : "Hidden"}
                        </Button>
                        <Button size="sm" variant="danger" onClick={onRemove}>
                            Remove
                        </Button>
                        {item.children && item.children.length > 0 && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="ml-auto"
                                onClick={onToggleCollapsible}
                            >
                                {item.collapsible ? "Expandable" : "Unexpandable"}
                            </Button>
                        )}
                    </div>

                    {/* Sub-items */}
                    {item.children && (
                        <div className="space-y-2 border-l border-[var(--color-border-subtle)] pl-4">
                            <p className="text-[11px] font-medium tracking-[0.1em] uppercase text-[var(--color-text-tertiary)]">
                                Sub-items
                            </p>
                            {item.children.map((child: any, childIndex: number) => (
                                <SubItemRow
                                    key={childIndex}
                                    child={child}
                                    onIconChange={(v) => onUpdateChild(childIndex, { icon: v })}
                                    onLabelChange={(v) => onUpdateChild(childIndex, { label: v })}
                                    onVisibleChange={(v) => onUpdateChild(childIndex, { visible: v })}
                                    onRemove={() => onRemoveChild(childIndex)}
                                />
                            ))}
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={onAddChild}
                                leftIcon={
                                    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
                                        <path d="M8 2v12M2 8h12" />
                                    </svg>
                                }
                            >
                                Add sub-item
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function NavigationSettings() {
    const { setItems, items, ICON_MAP, DEFAULT_ITEMS, sidebarHideable, setSidebarHideable } =
        useNavigation();
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const [resetConfirmed, setResetConfirmed] = useState(false);

    const updateItem = (index: number, patch: Partial<any>) => {
        setItems(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
        if (openIndex === index) setOpenIndex(null);
    };

    const updateChild = (itemIndex: number, childIndex: number, patch: Partial<any>) => {
        const newItems = [...items];
        newItems[itemIndex].children![childIndex] = {
            ...newItems[itemIndex].children![childIndex],
            ...patch,
        };
        setItems(newItems);
    };

    const removeChild = (itemIndex: number, childIndex: number) => {
        const newItems = [...items];
        newItems[itemIndex].children!.splice(childIndex, 1);
        setItems(newItems);
    };

    const addChild = (itemIndex: number) => {
        const newItems = [...items];
        newItems[itemIndex].children!.push({
            id: `child-${Date.now()}`,
            icon: "",
            label: "New sub-item",
            visible: true,
            href: "#",
        });
        setItems(newItems);
    };

    const toggleCollapsible = (index: number) => {
        const newItems = [...items];
        newItems[index].collapsible = !newItems[index].collapsible;
        setItems(newItems);
    };

    return (
        <div className="min-h-screen bg-[var(--color-surface)] px-6 py-20">
            <div className="mx-auto max-w-2xl">

                {/* ── Header ── */}
                <Text variant="label" className="mb-2 block">
                    Settings
                </Text>
                <h1 className="font-[family-name:var(--font-display)] text-[42px] leading-[1.1] tracking-[-0.01em] font-normal text-[var(--color-text-primary)]">
                    Navigation
                </h1>
                <p className="mt-3 text-lg leading-[1.7] text-[var(--color-text-secondary)]">
                    Edit labels, icons, and links. Reorder items and control <em className="italic text-[var(--color-text-tertiary)]">what shows</em> in your sidebar.
                </p>

                <Divider className="my-10" />

                {/* ── Sidebar hideable toggle ── */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <p className="font-medium text-[var(--color-text-primary)]">Hideable sidebar</p>
                        <p className="text-sm text-[var(--color-text-secondary)]">
                            Sidebar only appears when you hover over it.
                        </p>
                    </div>
                    <Toggle
                        checked={sidebarHideable}
                        onChange={(v) => setSidebarHideable(v)}
                    />
                </div>

                <Divider className="my-8" />

                {/* ── Nav items ── */}
                <div className="mb-4 flex items-center justify-between">
                    <Text variant="label">
                        Navigation items
                    </Text>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                            setItems([
                                ...items,
                                {
                                    id: `item-${Date.now()}`,
                                    label: "New item",
                                    href: "#",
                                    visible: true,
                                },
                            ])
                        }
                        leftIcon={
                            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
                                <path d="M8 2v12M2 8h12" />
                            </svg>
                        }
                    >
                        Add item
                    </Button>
                </div>

                {items.length === 0 ? (
                    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-muted)] px-6 py-8 text-center">
                        <p className="text-sm text-[var(--color-text-tertiary)]">No navigation items. Add one above.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {items.map((item, index) => (
                            <NavItemRow
                                key={item.id ?? index}
                                item={item}
                                index={index}
                                isOpen={openIndex === index}
                                onToggle={() => setOpenIndex((prev) => prev === index ? null : index)}
                                onUpdate={(patch) => updateItem(index, patch)}
                                onRemove={() => removeItem(index)}
                                onAddChild={() => addChild(index)}
                                onRemoveChild={(ci) => removeChild(index, ci)}
                                onUpdateChild={(ci, patch) => updateChild(index, ci, patch)}
                                onToggleCollapsible={() => toggleCollapsible(index)}
                                ICON_MAP={ICON_MAP}
                            />
                        ))}
                    </div>
                )}

                <Divider className="my-10" />

                {/* ── Footer actions ── */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                            setItems(DEFAULT_ITEMS);
                            setResetConfirmed(true);
                            setTimeout(() => setResetConfirmed(false), 3000);
                        }}
                    >
                        Reset to default
                    </Button>

                    <Link
                        href="/settings/appearance"
                        className="inline-flex items-center gap-2 text-sm text-[var(--color-text-tertiary)] underline-offset-4 transition-colors hover:text-[var(--color-text-primary)] hover:underline"
                    >
                        Edit navigation appearance →
                    </Link>
                </div>

                {resetConfirmed && (
                    <div className="mt-4">
                        <Alert
                            variant="success"
                            title="Reset complete"
                            description="Navigation restored to its default state."
                            onClose={() => setResetConfirmed(false)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}