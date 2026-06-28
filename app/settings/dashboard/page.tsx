"use client";

import { useAuth } from "@/context/authContext";
import { Text, Divider, Alert, Button, TextInput } from "@/components/ui/components";
import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";

function ActionRow({
    label,
    description,
    action,
    actionLabel,
    variant = "outline",
    icon,
    hasInput = false,
    inputPlaceholder = "",
    inputValue = "",
    setInputValue = () => {},
}: {
    label: string;
    description: string;
    action: () => void;
    actionLabel: string;
    variant?: "outline" | "danger" | "primary";
    icon?: React.ReactNode;
    hasInput?: boolean;
    inputPlaceholder?: string;
    inputValue?: string;
    setInputValue?: (value: string) => void;
}) {
    return (
        <div className="flex items-start justify-between gap-6 py-5">
            <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--color-text-primary)]">{label}</p>
                <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">{description}</p>
            </div>
            <div className="flex items-center gap-2 flex-col">
                {hasInput && (
                    <TextInput
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={inputPlaceholder}
                        className="mr-2"
                    />
                )}
                <Button variant={variant} size="sm" onClick={action} leftIcon={icon}>
                    {actionLabel}
                </Button>
            </div>
        </div>
    );
}

export default function AdvancedPage() {
    const [bg, setBg] = useState<string | null>(null);

    const [bgUpdated, setBgUpdated] = useState(false);

    const [updatingBg, setUpdatingBg] = useState(false);

    const updateBg = () => {
        setUpdatingBg(true);
        if (bg || bg === "") {
            window.localStorage.setItem("app-dashboard-bg", bg);
        } else {
            window.localStorage.removeItem("app-dashboard-bg");
        }
        setUpdatingBg(false);
        setBgUpdated(true);
    };

    useEffect(() => {
        if (typeof window === "undefined") return;

        const bg_ = window.localStorage.getItem("app-dashboard-bg");

        if (bg_) {
            setBg(bg_);
        } else {
            const defaultBg = "/images/backgrounds/builtin/0001.png";

            setBg(defaultBg);
            window.localStorage.setItem("app-dashboard-bg", defaultBg);
        }
    }, []);

    return (
        <div className="min-h-screen bg-[var(--color-surface)] px-6 py-20">
            <div className="mx-auto max-w-lg">
                <Text variant="label" className="mb-2 block">
                    Settings
                </Text>
                <h1 className="font-[family-name:var(--font-display)] text-[42px] leading-[1.1] tracking-[-0.01em] font-normal text-[var(--color-text-primary)]">
                    Dashboard
                </h1>
                <Text variant="bodyLg" className="mt-3 text-[var(--color-text-secondary)]">
                    Developer tools and <em>low-level controls</em>. Changes here can affect how
                    Schoolm8 fetches and displays your data.
                </Text>

                <Divider className="my-10" />

                {bgUpdated && (
                    <Alert
                        variant="success"
                        title="Success"
                        description="Background updated."
                        onClose={() => setBgUpdated(false)}
                        className="mb-6"
                    />
                )}
                <div className="divide-y divide-[var(--color-border-subtle)]">
                    <ActionRow
                        label="Update background"
                        description="Change the background of the dashboard. (Set to nothing for no background)"
                        action={updateBg}
                        actionLabel={updatingBg ? "Updating…" : "Update background"}
                        icon={<RotateCcw className="h-3.5 w-3.5" />}
                        hasInput={true}
                        inputPlaceholder="Enter background value"
                        inputValue={bg || ""}
                        setInputValue={(value) => setBg(value)}
                    />
                </div>
                <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                        setBg(null);
                        window.localStorage.removeItem("app-dashboard-bg");
                    }}
                >
                    Reset background
                </Button>
            </div>
        </div>
    );
}
