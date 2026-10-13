"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Text, Divider } from "@/components/ui/components";

export default function ScheduleSettingsPage() {
    return (
        <div className="min-h-screen bg-[var(--color-surface)] px-6 py-20">
            <div className="mx-auto max-w-lg">
                <Text variant="label" className="mb-2 block">
                    Settings / Schedule
                </Text>
                <h1 className="font-[family-name:var(--font-display)] text-[42px] leading-[1.1] font-normal text-[var(--color-text-primary)]">
                    Schedule
                </h1>
                <Text variant="bodyLg" className="mt-3 text-[var(--color-text-secondary)]">
                    Control how your timetable is combined, detected, and predicted.
                </Text>
                <Divider className="my-10" />
                <Link
                    href="/settings/schedule/timetable-layers"
                    className="group flex items-center gap-4 rounded-[var(--radius-lg)] px-4 py-4 transition-colors hover:bg-[var(--color-muted)]"
                >
                    <div className="flex-1">
                        <p className="font-medium text-[var(--color-text-primary)]">
                            Timetable Layers
                        </p>
                        <p className="text-sm text-[var(--color-text-secondary)]">
                            Configure timetable transformations and predicted classes.
                        </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[var(--color-text-disabled)]" />
                </Link>
            </div>
        </div>
    );
}
