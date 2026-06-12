"use client";

import { useAuth } from "@/context/authContext";
import { SiCanvas, SiGoogleclassroom } from "@icons-pack/react-simple-icons";
import { Table, ChevronRight } from "lucide-react";
import { Text, Divider, Badge, Card, Button, Spinner } from "@/components/ui/components";
import { useEffect, useMemo, useState } from "react";

type ConnectedServices = {
    canvas: boolean;
    googleClassroom: boolean;
    edumate: boolean;
    generic: boolean;
};

const defaultConnected: ConnectedServices = {
    canvas: false,
    googleClassroom: false,
    edumate: false,
    generic: false,
};

export default function IntegrationsPage() {
    const { user, loading, token } = useAuth();

    const [connectedServices, setConnectedServices] = useState<ConnectedServices>(defaultConnected);

    const [lmsLoading, setLmsLoading] = useState(true);
    const [timetableLoading, setTimetableLoading] = useState(true);

    /**
     * LMS fetch
     */
    useEffect(() => {
        if (loading || !user || !token) return;

        let cancelled = false;
        setLmsLoading(true);

        fetch("/api/lms/linked", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                if (cancelled) return;

                setConnectedServices((prev) => ({
                    ...prev,
                    canvas: data.lms === "canvas",
                    googleClassroom: data.lms === "googleClassroom",
                }));
            })
            .catch(console.error)
            .finally(() => {
                if (!cancelled) setLmsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [user, loading, token]);

    /**
     * Timetable fetch
     */
    useEffect(() => {
        if (loading || !user || !token) return;

        let cancelled = false;
        setTimetableLoading(true);

        fetch("/api/timetable/linked", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                if (cancelled) return;

                setConnectedServices((prev) => ({
                    ...prev,
                    edumate: data.timetable === "edumate",
                    generic: data.timetable === "generic",
                }));
            })
            .catch(console.error)
            .finally(() => {
                if (!cancelled) setTimetableLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [user, loading, token]);

    /**
     * Derived states
     */
    const lmsReady = !lmsLoading;
    const timetableReady = !timetableLoading;

    const lmsLocked = useMemo(
        () => connectedServices.canvas || connectedServices.googleClassroom,
        [connectedServices],
    );

    const timetableLocked = useMemo(
        () => connectedServices.edumate || connectedServices.generic,
        [connectedServices],
    );

    return (
        <div className="min-h-screen bg-[var(--color-surface)] px-6 py-20">
            <div className="mx-auto max-w-lg">
                <Text variant="label">Settings</Text>

                <h1 className="text-[42px] font-normal">Integrations</h1>

                <Divider className="my-10" />

                {/* LMS */}
                <SectionLabel>Learning Management System</SectionLabel>

                <Text variant="bodySm" className="mb-4">
                    Link your LMS so Schoolm8 can pull assignments, announcements, and course data
                    automatically.
                </Text>

                {!lmsReady ? (
                    <Spinner />
                ) : (
                    <>
                        {/* Disconnect moved OUT of list flow */}
                        <div className="mb-2 flex justify-end">
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={!lmsLocked}
                                onClick={() => {}}
                                className="text-[var(--color-text-secondary)] hover:text-red-600"
                            >
                                Disconnect
                            </Button>
                        </div>

                        <nav className="space-y-1">
                            <IntegrationRow
                                icon={<SiCanvas className="h-5 w-5" />}
                                label="Canvas"
                                connected={connectedServices.canvas}
                                disabled={lmsLocked}
                            />
                            <IntegrationRow
                                icon={<SiGoogleclassroom className="h-5 w-5" />}
                                label="Google Classroom"
                                connected={connectedServices.googleClassroom}
                                disabled={lmsLocked}
                            />
                        </nav>
                    </>
                )}

                {/* Timetable */}
                <SectionLabel>Timetable</SectionLabel>

                <Text variant="bodySm" className="mb-4">
                    Connect your timetable provider for schedule views, class reminders, and
                    personalised study guides.
                </Text>

                {!timetableReady ? (
                    <Spinner />
                ) : (
                    <>
                        {/* Disconnect moved OUT of list flow */}
                        <div className="mb-2 flex justify-end">
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={!timetableLocked}
                                onClick={() => {}}
                                className="text-[var(--color-text-secondary)] hover:text-red-600"
                            >
                                Disconnect
                            </Button>
                        </div>

                        <nav className="space-y-1">
                            <IntegrationRow
                                icon={
                                    <img
                                        src="https://edumate.com.au/favicon.ico"
                                        className="h-5 w-5"
                                        alt="Edumate"
                                    />
                                }
                                label="Edumate"
                                connected={connectedServices.edumate}
                                disabled={timetableLocked}
                            />
                            <IntegrationRow
                                icon={<Table className="h-5 w-5" />}
                                label="Generic (iCal / file upload)"
                                connected={connectedServices.generic}
                                disabled={timetableLocked}
                            />
                        </nav>
                    </>
                )}
            </div>
        </div>
    );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <Text variant="label" className="mb-1 mt-8 block first:mt-0">
            {children}
        </Text>
    );
}

function IntegrationRow({
    icon,
    label,
    connected,
    disabled,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    connected?: boolean;
    disabled?: boolean;
    onClick?: () => void;
}) {
    const isDisabled = disabled || connected === true;

    return (
        <Button
            disabled={isDisabled}
            onClick={onClick}
            variant="outline"
            className="group flex w-full items-center gap-4 py-8"
        >
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-subtle)] text-[var(--color-primary)]">
                {icon}
            </div>

            <div className="flex-1 min-w-0">
                <p className="font-medium">{label}</p>
            </div>

            {connected !== undefined && (
                <Badge variant={connected ? "success" : "default"} dot>
                    {connected ? "Connected" : "Not connected"}
                </Badge>
            )}

            <ChevronRight className="h-4 w-4 text-[var(--color-text-disabled)] group-hover:translate-x-0.5" />
        </Button>
    );
}
