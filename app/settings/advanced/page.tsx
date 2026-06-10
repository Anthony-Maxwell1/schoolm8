"use client";

import { useAuth } from "@/context/authContext";
import { Text, Divider, Alert, Button } from "@/components/ui/components";
import { useState } from "react";
import { RotateCcw } from "lucide-react";

function ActionRow({
    label,
    description,
    action,
    actionLabel,
    variant = "outline",
    icon,
}: {
    label: string;
    description: string;
    action: () => void;
    actionLabel: string;
    variant?: "outline" | "danger" | "primary";
    icon?: React.ReactNode;
}) {
    return (
        <div className="flex items-start justify-between gap-6 py-5">
            <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--color-text-primary)]">{label}</p>
                <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">{description}</p>
            </div>
            <Button variant={variant} size="sm" onClick={action} leftIcon={icon}>
                {actionLabel}
            </Button>
        </div>
    );
}

export default function AdvancedPage() {
    const { token } = useAuth();
    const [cleared, setCleared] = useState(false);
    const [clearing, setClearing] = useState(false);

    const clearTimetableCache = async () => {
        setClearing(true);
        await fetch("/api/timetable/clearCache", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });
        setClearing(false);
        setCleared(true);
        setTimeout(() => setCleared(false), 4000);
    };

    return (
        <div className="min-h-screen bg-[var(--color-surface)] px-6 py-20">
            <div className="mx-auto max-w-lg">
                <Text variant="label" className="mb-2 block">
                    Settings
                </Text>
                <h1 className="font-[family-name:var(--font-display)] text-[42px] leading-[1.1] tracking-[-0.01em] font-normal text-[var(--color-text-primary)]">
                    Advanced
                </h1>
                <Text variant="bodyLg" className="mt-3 text-[var(--color-text-secondary)]">
                    Developer tools and <em>low-level controls</em>. Changes here can affect
                    how Schoolm8 fetches and displays your data.
                </Text>

                <Divider className="my-10" />

                {cleared && (
                    <Alert
                        variant="success"
                        title="Cache cleared"
                        description="Your timetable cache has been reset. Data will be re-fetched on next load."
                        onClose={() => setCleared(false)}
                        className="mb-6"
                    />
                )}

                <Text variant="label" className="mb-1 block">Cache</Text>
                <div className="divide-y divide-[var(--color-border-subtle)]">
                    <ActionRow
                        label="Reset timetable cache"
                        description="Forces a fresh fetch of your timetable on next page load. Useful if your schedule looks out of date."
                        action={clearTimetableCache}
                        actionLabel={clearing ? "Clearing…" : "Clear cache"}
                        icon={<RotateCcw className="h-3.5 w-3.5" />}
                    />
                </div>
            </div>
        </div>
    );
}