"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/authContext";
import { Alert, Button, Divider, Text } from "@/components/ui/components";
import { defaultSettings, TimetableLayerSettings } from "@/lib/schedule/layers";

type SettingKey = keyof TimetableLayerSettings;

const OPTIONS: { key: SettingKey; label: string; description: string }[] = [
    {
        key: "combineDoublePeriods",
        label: "Combine double periods",
        description: "Merge adjacent matching class periods into one event.",
    },
    {
        key: "locateRepeatingClasses",
        label: "Locate repeating classes",
        description: "Detect classes that repeat on a regular schedule.",
    },
    {
        key: "predictMissingClasses",
        label: "Predict missing classes",
        description: "Fill gaps in established repetition patterns.",
    },
    {
        key: "markPredictedClasses",
        label: "Mark predicted classes",
        description: "Label generated events as Predicted.",
    },
    {
        key: "detectFortnightlyPatterns",
        label: "Detect fortnightly patterns",
        description:
            "Prefer a two-week pattern when events support it instead of incorrectly repeating them weekly.",
    },
    {
        key: "avoidWeekendPredictions",
        label: "Avoid weekend predictions",
        description: "Do not predict school classes on Saturday or Sunday.",
    },
];

export default function TimetableLayersSettingsPage() {
    const { token } = useAuth();
    const [values, setValues] = useState<TimetableLayerSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;
        fetch("/api/user/get", { headers: { Authorization: `Bearer ${token}` } })
            .then(async (response) => {
                if (!response.ok) throw new Error("Could not load schedule settings");
                const data = await response.json();
                setValues({ ...defaultSettings, ...data.userData?.schedule?.timetableLayers });
            })
            .catch((error) =>
                setMessage(error instanceof Error ? error.message : "Could not load settings"),
            )
            .finally(() => setLoading(false));
    }, [token]);

    const save = async () => {
        if (!token) return;
        setSaving(true);
        setMessage(null);
        try {
            const current = await fetch("/api/user/get", {
                headers: { Authorization: `Bearer ${token}` },
            }).then((response) => response.json());
            const response = await fetch("/api/user/set", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...current.userData,
                    schedule: {
                        ...current.userData?.schedule,
                        timetableLayers: values,
                    },
                }),
            });
            if (!response.ok) throw new Error("Could not save schedule settings");
            setMessage("Schedule settings saved.");
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "Could not save settings");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-surface)] px-6 py-20">
            <div className="mx-auto max-w-lg">
                <Text variant="label" className="mb-2 block">
                    Settings / Schedule / Timetable Layers
                </Text>
                <h1 className="font-[family-name:var(--font-display)] text-[42px] leading-[1.1] font-normal text-[var(--color-text-primary)]">
                    Timetable Layers
                </h1>
                <Text variant="bodyLg" className="mt-3 text-[var(--color-text-secondary)]">
                    Choose which timetable transformations are applied when your schedule is
                    translated.
                </Text>
                <Divider className="my-10" />
                {message && <Alert className="mb-6" variant="info" description={message} />}
                <div className="divide-y divide-[var(--color-border-subtle)]">
                    {OPTIONS.map(({ key, label, description }) => (
                        <label
                            key={key}
                            className="flex cursor-pointer items-start justify-between gap-6 py-5"
                        >
                            <span>
                                <span className="block font-medium text-[var(--color-text-primary)]">
                                    {label}
                                </span>
                                <span className="mt-0.5 block text-sm text-[var(--color-text-secondary)]">
                                    {description}
                                </span>
                            </span>
                            <input
                                type="checkbox"
                                checked={loading ? defaultSettings[key] : values[key]}
                                disabled={loading}
                                onChange={(event) =>
                                    setValues((current) => ({
                                        ...current,
                                        [key]: event.target.checked,
                                    }))
                                }
                                className="mt-1 h-4 w-4 accent-[var(--color-primary)]"
                            />
                        </label>
                    ))}
                </div>
                <Button className="mt-8" onClick={save} disabled={loading || saving}>
                    {saving ? "Saving..." : "Save settings"}
                </Button>
            </div>
        </div>
    );
}
