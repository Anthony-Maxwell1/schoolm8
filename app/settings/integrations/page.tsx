"use client";

import { useAuth } from "@/context/authContext";
import { SiCanvas, SiGoogleclassroom } from "@icons-pack/react-simple-icons";
import { Table, ChevronRight } from "lucide-react";
import { SiGooglecalendar } from "@icons-pack/react-simple-icons";
import {
    Text,
    Divider,
    Badge,
    Card,
    Button,
    TextInput,
    Modal,
    Alert,
} from "@/components/ui/components";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

type IntegrationKey = "canvas" | "classroom" | "edumate" | "generic";

function IntegrationRow({
    icon,
    label,
    description,
    connected,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    description?: string;
    connected?: boolean;
    onClick?: () => void;
}) {
    return (
        <button
            type="button"
            className="group flex w-full items-center gap-4 rounded-[var(--radius-lg)] px-4 py-4 text-left transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-muted)]"
            onClick={onClick}
        >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-subtle)] text-[var(--color-primary)]">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--color-text-primary)]">{label}</p>
                {description && (
                    <p className="text-sm text-[var(--color-text-secondary)]">{description}</p>
                )}
            </div>
            {connected !== undefined && (
                <Badge variant={connected ? "success" : "default"} dot>
                    {connected ? "Connected" : "Connect"}
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
    const { user, loading, token } = useAuth();
    const [connected, setConnected] = useState({
        canvas: false,
        classroom: false,
        edumate: false,
        generic: false,
        calendar: false,
    });

    const [activeModal, setActiveModal] = useState<IntegrationKey | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Form fields
    const [canvasUrl, setCanvasUrl] = useState("");
    const [canvasToken, setCanvasToken] = useState("");
    const [edumateUrl, setEdumateUrl] = useState("");
    const [edumateUser, setEdumateUser] = useState("");
    const [edumatePass, setEdumatePass] = useState("");
    const [icalUrl, setIcalUrl] = useState("");
    const [icalUser, setIcalUser] = useState("");
    const [icalPass, setIcalPass] = useState("");

    useEffect(() => {
        if (loading || !user || !token) return;

        // Must send the ID token — otherwise this 401s and everything shows
        // "not connected" even when it's saved.
        fetch("/api/lms/linked", { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => res.json())
            .then((data) => {
                const lms = String(data.lms ?? "").toLowerCase();
                setConnected((prev) => ({
                    ...prev,
                    canvas: lms === "canvas",
                    classroom: lms === "googleclassroom",
                }));
            })
            .catch(() => {});

        fetch("/api/calendar/status", { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => res.json())
            .then((data) => setConnected((prev) => ({ ...prev, calendar: !!data.connected })))
            .catch(() => {});
    }, [user, loading, token]);

    const closeModal = () => {
        if (submitting) return;
        setActiveModal(null);
    };

    const connectCanvas = async () => {
        if (!canvasUrl.trim() || !canvasToken.trim()) {
            toast.error("Enter both your Canvas URL and access token.");
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch("/api/canvas/connect", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ baseUrl: canvasUrl.trim().replace(/\/$/, ""), token: canvasToken.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to connect Canvas");
            setConnected((p) => ({ ...p, canvas: true }));
            setActiveModal(null);
            setCanvasToken("");
            toast.success("Canvas connected — syncing your courses…");
            // Kick off an initial sync so assignments/announcements appear.
            fetch("/api/canvas/sync", { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to connect Canvas");
        } finally {
            setSubmitting(false);
        }
    };

    const connectClassroom = async () => {
        setSubmitting(true);
        try {
            const res = await fetch("/api/auth/universalState", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    scopeGroup: "classroom",
                    redirectUrl: "/settings/integrations?classroom=connected",
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to start Google sign-in");
            window.location.href = `/api/auth/google/auth?state=${data.state}&scope=classroom`;
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to start Google sign-in");
            setSubmitting(false);
        }
    };

    const connectCalendar = async () => {
        if (connected.calendar) {
            if (!confirm("Disconnect Google Calendar?")) return;
            try {
                await fetch("/api/calendar/disconnect", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                });
                setConnected((p) => ({ ...p, calendar: false }));
                toast.success("Google Calendar disconnected.");
            } catch {
                toast.error("Could not disconnect Google Calendar");
            }
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch("/api/auth/universalState", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    scopeGroup: "calendar",
                    redirectUrl: "/settings/integrations?calendar=connected",
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to start Google sign-in");
            window.location.href = `/api/auth/google/auth?state=${data.state}&scope=calendar`;
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to start Google sign-in");
            setSubmitting(false);
        }
    };

    const connectEdumate = async () => {
        if (!edumateUrl.trim() || !edumateUser.trim() || !edumatePass) {
            toast.error("Enter your Edumate URL, username, and password.");
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch("/api/timetable/setup/edumate", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    baseUrl: edumateUrl.trim().replace(/\/$/, ""),
                    username: edumateUser.trim(),
                    password: edumatePass,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to connect Edumate");
            setConnected((p) => ({ ...p, edumate: true }));
            setActiveModal(null);
            setEdumatePass("");
            toast.success("Edumate connected.");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to connect Edumate");
        } finally {
            setSubmitting(false);
        }
    };

    const connectGeneric = async () => {
        if (!icalUrl.trim()) {
            toast.error("Enter your iCal feed URL.");
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch("/api/timetable/setup/ical", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    url: icalUrl.trim(),
                    username: icalUser.trim(),
                    password: icalPass,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to connect timetable");
            setConnected((p) => ({ ...p, generic: true }));
            setActiveModal(null);
            toast.success("Timetable connected.");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to connect timetable");
        } finally {
            setSubmitting(false);
        }
    };

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
                <nav className="space-y-1">
                    <IntegrationRow
                        icon={<SiCanvas className="h-5 w-5" />}
                        label="Canvas"
                        description="Access token + school Canvas URL"
                        connected={connected.canvas}
                        onClick={() => setActiveModal("canvas")}
                    />
                    <IntegrationRow
                        icon={<SiGoogleclassroom className="h-5 w-5" />}
                        label="Google Classroom"
                        description="Sign in with Google"
                        connected={connected.classroom}
                        onClick={connectClassroom}
                    />
                </nav>

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
                                alt=""
                                className="h-5 w-5"
                            />
                        }
                        label="Edumate"
                        description="School domain, username & password"
                        connected={connected.edumate}
                        onClick={() => setActiveModal("edumate")}
                    />
                    <IntegrationRow
                        icon={<Table className="h-5 w-5" />}
                        label="Generic (iCal feed)"
                        description="Any calendar feed URL (.ics)"
                        connected={connected.generic}
                        onClick={() => setActiveModal("generic")}
                    />
                </nav>

                <SectionLabel>Calendar</SectionLabel>
                <Text variant="bodySm" className="mb-4">
                    Connect Google Calendar so the Smart Scheduler can see your existing events and
                    add study sessions straight to your calendar.
                </Text>
                <nav className="space-y-1">
                    <IntegrationRow
                        icon={<SiGooglecalendar className="h-5 w-5" />}
                        label="Google Calendar"
                        description={
                            connected.calendar
                                ? "Reading events & adding study sessions"
                                : "Sign in with Google (read & add events)"
                        }
                        connected={connected.calendar}
                        onClick={connectCalendar}
                    />
                </nav>
            </div>

            {/* Canvas modal */}
            <Modal
                open={activeModal === "canvas"}
                onClose={closeModal}
                title="Connect Canvas"
                description="Find these in Canvas → Account → Settings → New access token."
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={closeModal} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button onClick={connectCanvas} loading={submitting}>
                            Connect
                        </Button>
                    </div>
                }
            >
                <div className="space-y-3">
                    <TextInput
                        label="Canvas URL"
                        placeholder="https://yourschool.instructure.com"
                        value={canvasUrl}
                        onChange={(e) => setCanvasUrl(e.target.value)}
                    />
                    <TextInput
                        label="Access token"
                        type="password"
                        autoComplete="off"
                        placeholder="Paste your Canvas access token"
                        value={canvasToken}
                        onChange={(e) => setCanvasToken(e.target.value)}
                    />
                </div>
            </Modal>

            {/* Edumate modal */}
            <Modal
                open={activeModal === "edumate"}
                onClose={closeModal}
                title="Connect Edumate"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={closeModal} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button onClick={connectEdumate} loading={submitting}>
                            Connect
                        </Button>
                    </div>
                }
            >
                <Alert
                    variant="info"
                    className="mb-3"
                    description="Your password is sent securely to log in to Edumate and is stored encrypted."
                />
                <div className="space-y-3">
                    <TextInput
                        label="Edumate URL"
                        placeholder="https://yourschool.edumate.com.au"
                        value={edumateUrl}
                        onChange={(e) => setEdumateUrl(e.target.value)}
                    />
                    <TextInput
                        label="Username"
                        autoComplete="off"
                        value={edumateUser}
                        onChange={(e) => setEdumateUser(e.target.value)}
                    />
                    <TextInput
                        label="Password"
                        type="password"
                        autoComplete="off"
                        value={edumatePass}
                        onChange={(e) => setEdumatePass(e.target.value)}
                    />
                </div>
            </Modal>

            {/* Generic iCal modal */}
            <Modal
                open={activeModal === "generic"}
                onClose={closeModal}
                title="Connect a calendar feed"
                description="Paste any iCal (.ics) feed URL. Username & password are optional (only if the feed needs them)."
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={closeModal} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button onClick={connectGeneric} loading={submitting}>
                            Connect
                        </Button>
                    </div>
                }
            >
                <div className="space-y-3">
                    <TextInput
                        label="iCal feed URL"
                        placeholder="https://…/timetable.ics"
                        value={icalUrl}
                        onChange={(e) => setIcalUrl(e.target.value)}
                    />
                    <TextInput
                        label="Username (optional)"
                        autoComplete="off"
                        value={icalUser}
                        onChange={(e) => setIcalUser(e.target.value)}
                    />
                    <TextInput
                        label="Password (optional)"
                        type="password"
                        autoComplete="off"
                        value={icalPass}
                        onChange={(e) => setIcalPass(e.target.value)}
                    />
                </div>
            </Modal>
        </div>
    );
}
