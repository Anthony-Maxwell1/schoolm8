"use client";

import { useAuth } from "@/context/authContext";
import { SiCanvas, SiGoogleclassroom } from "@icons-pack/react-simple-icons";
import { Table, ChevronRight, Pill } from "lucide-react";
import { Text, Divider, Badge, Card } from "@/components/ui/components";
import { useEffect, useState } from "react";

function IntegrationRow({
    icon,
    label,
    connected,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    connected?: boolean;
    onClick?: () => void;
}) {
    return (
        <button
            className="group flex w-full items-center gap-4 rounded-[var(--radius-lg)] px-4 py-4 text-left transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-muted)]"
            onClick={onClick}
        >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-subtle)] text-[var(--color-primary)]">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--color-text-primary)]">{label}</p>
            </div>
            {connected !== undefined && (
                <Badge variant={connected ? "success" : "default"} dot>
                    {connected ? "Connected" : "Not connected"}
                </Badge>
            )}
            <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-text-disabled)] transition-transform group-hover:translate-x-0.5" />
        </button>
    );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <Text variant="label" className="mb-1 mt-8 block first:mt-0">
            {children}
        </Text>
    );
}

export default function IntegrationsPage() {
    const { user, loading } = useAuth();
    const [connectedServices, setConnectedServices] = useState({
        canvas: false,
        googleClassroom: false,
        edumate: false,
        generic: false,
    });

    useEffect(() => {
        if (loading || !user) return;

        fetch("/api/lms/linked")
            .then((res) => res.json())
            .then((data) => {
                console.log("Linked LMS response:", data); // Debug log to check API response
                setConnectedServices({
                    canvas: data.lms === "canvas",
                    googleClassroom: data.lms === "googleClassroom",
                    edumate: false, // Placeholder, implement actual check when API is ready
                    generic: false, // Placeholder, implement actual check when API is ready
                });
            })
            .catch((err) => {
                console.error("Error fetching linked LMS:", err);
            });
    }, [user, loading]);

    return (
        <div className="min-h-screen bg-[var(--color-surface)] px-6 py-20">
            <div className="mx-auto max-w-lg">
                <Text variant="label" className="mb-2 block">
                    Settings
                </Text>
                <h1 className="font-[family-name:var(--font-display)] text-[42px] leading-[1.1] tracking-[-0.01em] font-normal text-[var(--color-text-primary)]">
                    Integrations
                </h1>
                <Text variant="bodyLg" className="mt-3 text-[var(--color-text-secondary)]">
                    Connect Schoolm8 to your <em>learning tools</em> — your LMS, timetable, and any
                    other services your school uses.
                </Text>

                <Divider className="my-10" />

                <SectionLabel>Learning Management System</SectionLabel>
                <Text variant="bodySm" className="mb-4">
                    Link your LMS so Schoolm8 can pull assignments, announcements, and course data
                    automatically.
                </Text>

                {connectedServices.canvas || connectedServices.googleClassroom ? (
                    <Card>
                        {connectedServices.canvas ? (
                            <Badge variant="success" className="mb-2">
                                Canvas connected as LMS!
                            </Badge>
                        ) : connectedServices.googleClassroom ? (
                            <Badge variant="success" className="mb-2">
                                Google Classroom connected as LMS!
                            </Badge>
                        ) : null}
                    </Card>
                ) : (
                    <nav className="space-y-1">
                        <IntegrationRow icon={<SiCanvas className="h-5 w-5" />} label="Canvas" />
                        <IntegrationRow
                            icon={<SiGoogleclassroom className="h-5 w-5" />}
                            label="Google Classroom"
                        />
                    </nav>
                )}

                <SectionLabel>Timetable</SectionLabel>
                <Text variant="bodySm" className="mb-4">
                    Connect your timetable provider for schedule views, class reminders, and
                    personalised study guides.
                </Text>
                <nav className="space-y-1">
                    <IntegrationRow
                        icon={
                            <img
                                src="https://edumate.com.au/favicon.ico"
                                alt="Edumate"
                                className="h-5 w-5"
                                // style={{ filter: "invert(40%) sepia(60%) saturate(400%) hue-rotate(10deg)" }}
                            />
                        }
                        label="Edumate"
                    />
                    <IntegrationRow
                        icon={<Table className="h-5 w-5" />}
                        label="Generic (iCal / file upload)"
                    />
                </nav>
            </div>
        </div>
    );
}
