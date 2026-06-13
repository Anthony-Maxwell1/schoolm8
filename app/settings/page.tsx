"use client";

import Link from "next/link";
import { Text, Divider } from "@/components/ui/components";
import {
    Puzzle,
    Palette,
    Settings2,
    UserCircle,
    ListTodo,
    ChevronRight,
    Sparkles,
} from "lucide-react";

const LINKS = [
    {
        href: "/settings/integrations",
        label: "Integrations",
        description: "Connect your LMS, timetable, and other services.",
        icon: Puzzle,
    },
    {
        href: "/settings/ai",
        label: "AI & API keys",
        description: "Add your Gemini key, pick a model, manage AI features.",
        icon: Sparkles,
    },
    {
        href: "/settings/appearance",
        label: "Themes & Styles",
        description: "Customise colours, layouts, and dashboard themes.",
        icon: Palette,
    },
    {
        href: "/settings/advanced",
        label: "Advanced",
        description: "Developer tools, cache management, and raw config.",
        icon: Settings2,
    },
    {
        href: "/settings/account",
        label: "Account",
        description: "Manage your login, email, and account data.",
        icon: UserCircle,
    },
    {
        href: "/settings/tasks",
        label: "Tasks & Jobs",
        description: "View scheduled background tasks and sync jobs.",
        icon: ListTodo,
    },
];

export default function SettingsPage() {
    return (
        <div className="min-h-screen bg-[var(--color-surface)] px-6 py-20">
            <div className="mx-auto max-w-lg">
                <Text variant="label" className="mb-2 block">
                    Configuration
                </Text>
                <h1 className="font-[family-name:var(--font-display)] text-[42px] leading-[1.1] tracking-[-0.01em] font-normal text-[var(--color-text-primary)]">
                    Settings
                </h1>
                <Text variant="bodyLg" className="mt-3 text-[var(--color-text-secondary)]">
                    Manage your account, integrations, and <em>personalise</em> every detail of your portal.
                </Text>

                <Divider className="my-10" />

                <nav className="space-y-1">
                    {LINKS.map(({ href, label, description, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className="group flex items-center gap-4 rounded-[var(--radius-lg)] px-4 py-4 transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-muted)]"
                        >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-subtle)] text-[var(--color-primary)] transition-colors group-hover:bg-[var(--color-primary)] group-hover:text-[var(--color-on-primary)]">
                                <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-[var(--color-text-primary)]">{label}</p>
                                <p className="text-sm text-[var(--color-text-secondary)]">{description}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-text-disabled)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--color-text-tertiary)]" />
                        </Link>
                    ))}
                </nav>
            </div>
        </div>
    );
}