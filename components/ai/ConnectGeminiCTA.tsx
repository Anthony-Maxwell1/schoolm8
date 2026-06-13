"use client";

/**
 * components/ai/ConnectGeminiCTA.tsx
 *
 * Friendly, reusable "connect your Gemini key" state shown by any AI feature
 * when no (or an invalid) key is configured. Links to Settings → AI and the
 * setup walkthrough.
 */

import Link from "next/link";
import { Sparkles, KeyRound, BookOpen } from "lucide-react";
import { Button, EmptyState } from "@/components/ui/components";

export function ConnectGeminiCTA({
    feature = "AI features",
    invalid = false,
}: {
    feature?: string;
    invalid?: boolean;
}) {
    return (
        <EmptyState
            icon={<Sparkles className="h-6 w-6" />}
            title={invalid ? "Your Gemini key needs attention" : `Connect your Gemini key to unlock ${feature}`}
            description={
                invalid
                    ? "Google rejected the saved key. Re-enter a valid key to keep using the tutor, scheduler, and study tools."
                    : "SchoolMate uses your own free Google Gemini key so the tutor, scheduler, and study tools work just for you. It takes about a minute to set up."
            }
            actions={
                <div className="flex flex-wrap items-center justify-center gap-2">
                    <Link href="/settings/ai">
                        <Button leftIcon={<KeyRound className="h-4 w-4" />}>
                            {invalid ? "Update key" : "Add your key"}
                        </Button>
                    </Link>
                    <Link href="/docs/gemini-setup">
                        <Button variant="outline" leftIcon={<BookOpen className="h-4 w-4" />}>
                            How to get a key
                        </Button>
                    </Link>
                </div>
            }
        />
    );
}
