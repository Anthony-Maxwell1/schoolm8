"use client";

import { useAuth } from "@/context/authContext";
import { SiCanvas, SiGoogleclassroom } from "@icons-pack/react-simple-icons";
import { Table, ChevronRight, CheckCircle2 } from "lucide-react";
import {
    Text,
    Divider,
    Badge,
    Button,
    Spinner,
    Modal,
    TextInput,
    Select,
    Alert,
} from "@/components/ui/components";
import { useEffect, useState } from "react";
import Image from "next/image";
import image0001 from "@/public/images/onboarding/0001.png";
import image0002 from "@/public/images/onboarding/0002.png";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ConnectedServices = {
    canvas: boolean;
    googleClassroom: boolean;
    edumate: boolean;
    generic: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// Shared sub-components
// ─────────────────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <Text variant="label" className="mb-1 mt-10 block first:mt-0">
            {children}
        </Text>
    );
}

function SuccessBanner({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-success-light)] px-4 py-3 text-sm text-[var(--color-success)]">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{label} connected successfully!</span>
        </div>
    );
}

function IntegrationRow({
    icon,
    label,
    connected,
    locked,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    connected: boolean;
    locked: boolean;
    onClick: () => void;
}) {
    return (
        <button
            disabled={locked && !connected}
            onClick={onClick}
            className="group flex w-full items-center gap-4 rounded-[var(--radius-lg)] px-4 py-4 text-left transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-muted)] disabled:cursor-not-allowed disabled:opacity-50"
        >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-subtle)] text-[var(--color-primary)]">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--color-text-primary)]">{label}</p>
            </div>
            <Badge variant={connected ? "success" : "default"} dot>
                {connected ? "Connected" : "Not connected"}
            </Badge>
            {!locked && (
                <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-text-disabled)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--color-text-tertiary)]" />
            )}
        </button>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Canvas modal
// ─────────────────────────────────────────────────────────────────────────────

function CanvasModal({
    open,
    onClose,
    onConnected,
    token,
}: {
    open: boolean;
    onClose: () => void;
    onConnected: () => void;
    token: string | null;
}) {
    const [baseUrl, setBaseUrl] = useState("");
    const [accessToken, setAccessToken] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleConnect = async () => {
        if (!baseUrl || !accessToken) {
            setError("Please enter both the base URL and access token.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/canvas/connect", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ baseUrl, token: accessToken }),
            });
            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error || "Failed to connect");
            }
            setSuccess(true);
            setTimeout(() => {
                onConnected();
                onClose();
            }, 1500);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Connect Canvas"
            description="We need a few details to link your Canvas account."
            size="lg"
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button loading={loading} onClick={handleConnect} disabled={success}>
                        Connect
                    </Button>
                </>
            }
        >
            <div className="space-y-5">
                {success && <SuccessBanner label="Canvas" />}
                {error && (
                    <Alert
                        variant="danger"
                        title="Connection failed"
                        description={error}
                        onClose={() => setError(null)}
                    />
                )}
                <TextInput
                    label="Base URL"
                    placeholder="yourschool.instructure.com"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    hint="The domain only — e.g. yourschool.instructure.com"
                />
                <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)]">
                    <Image src={image0001} alt="Canvas base URL example" className="w-full" />
                </div>
                <TextInput
                    label="Access token"
                    placeholder="Paste your Canvas access token"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    hint="Canvas → Account → Settings → Approved Integrations → New Access Token"
                />
                <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)]">
                    <Image src={image0002} alt="Canvas access token example" className="w-full" />
                </div>
            </div>
        </Modal>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Google Classroom modal
// ─────────────────────────────────────────────────────────────────────────────

function GoogleClassroomModal({
    open,
    onClose,
    token,
}: {
    open: boolean;
    onClose: () => void;
    token: string | null;
}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConnect = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/auth/universalState", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    scopeGroup: "classroom",
                    redirectUrl: "/settings/integrations?oauthReturn=classroom",
                }),
            });
            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error || "Failed to generate state");
            }
            const data = await res.json();
            window.location.href = `/api/auth/google/auth?state=${data.state}&scope=classroom`;
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Connect Google Classroom"
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button loading={loading} onClick={handleConnect}>
                        Continue with Google
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                {error && (
                    <Alert
                        variant="danger"
                        title="Error"
                        description={error}
                        onClose={() => setError(null)}
                    />
                )}
                <Text variant="bodySm">
                    You'll be redirected to Google's OAuth page to grant Schoolm8 read-only access
                    to your Classroom data. After authorising, you'll be returned here
                    automatically.
                </Text>
                <Alert
                    variant="info"
                    title="What we access"
                    description="We only read your courses, assignments, and announcements. We never post or modify anything on your behalf."
                />
            </div>
        </Modal>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Edumate modal
// ─────────────────────────────────────────────────────────────────────────────

function EdumateModal({
    open,
    onClose,
    onConnected,
    token,
}: {
    open: boolean;
    onClose: () => void;
    onConnected: () => void;
    token: string | null;
}) {
    const [baseUrl, setBaseUrl] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleConnect = async () => {
        if (!baseUrl || !username || !password) {
            setError("Please fill in all fields.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/timetable/setup/edumate", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ baseUrl, username, password }),
            });
            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error || "Failed to connect");
            }
            setSuccess(true);
            setTimeout(() => {
                onConnected();
                onClose();
            }, 1500);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Connect Edumate"
            description="We use Edumate's internal API to fetch your timetable."
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button loading={loading} onClick={handleConnect} disabled={success}>
                        Connect
                    </Button>
                </>
            }
        >
            <div className="space-y-5">
                {success && <SuccessBanner label="Edumate" />}
                {error && (
                    <Alert
                        variant="danger"
                        title="Connection failed"
                        description={error}
                        onClose={() => setError(null)}
                    />
                )}
                <Alert
                    variant="warning"
                    title="Unofficial connection"
                    description="This uses a reverse-engineered API and may break without notice. If your school supports iCal, use Generic instead."
                />
                <TextInput
                    label="Base URL"
                    placeholder="norwest.edumate.net"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    hint="Domain only, no https://. E.g. norwest.edumate.net"
                />
                <TextInput
                    label="Username"
                    placeholder="Your Edumate username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <TextInput
                    label="Password"
                    type="password"
                    placeholder="Your Edumate password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>
        </Modal>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Generic (iCal) modal
// ─────────────────────────────────────────────────────────────────────────────

function GenericModal({
    open,
    onClose,
    onConnected,
    token,
}: {
    open: boolean;
    onClose: () => void;
    onConnected: () => void;
    token: string | null;
}) {
    const [method, setMethod] = useState("");
    const [icalUrl, setIcalUrl] = useState("");
    const [icalUsername, setIcalUsername] = useState("");
    const [icalPassword, setIcalPassword] = useState("");
    const [icalData, setIcalData] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleConnect = async () => {
        setLoading(true);
        setError(null);
        try {
            if (method === "ical-url") {
                if (!icalUrl || !icalUsername || !icalPassword) {
                    setError("Please fill in all fields.");
                    setLoading(false);
                    return;
                }
                const res = await fetch("/api/timetable/setup/ical", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        url: icalUrl,
                        username: icalUsername,
                        password: icalPassword,
                    }),
                });
                if (!res.ok) {
                    const d = await res.json();
                    throw new Error(d.error || "Failed to connect");
                }
            } else if (method === "ical-file") {
                if (!icalData) {
                    setError("Please upload a file.");
                    setLoading(false);
                    return;
                }
                const res = await fetch("/api/timetable/setup/ical-file", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ data: icalData }),
                });
                if (!res.ok) {
                    const d = await res.json();
                    throw new Error(d.error || "Failed to upload");
                }
            }
            setSuccess(true);
            setTimeout(() => {
                onConnected();
                onClose();
            }, 1500);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Connect timetable"
            description="Link your timetable via iCal URL, file upload, or a third-party calendar app."
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        loading={loading}
                        onClick={handleConnect}
                        disabled={!method || success || method === "third-party"}
                    >
                        Connect
                    </Button>
                </>
            }
        >
            <div className="space-y-5">
                {success && <SuccessBanner label="Timetable" />}
                {error && (
                    <Alert
                        variant="danger"
                        title="Connection failed"
                        description={error}
                        onClose={() => setError(null)}
                    />
                )}

                <Select
                    label="Method"
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    options={[
                        { value: "", label: "Choose a method…" },
                        { value: "ical-url", label: "iCal URL — syncs live (recommended)" },
                        { value: "ical-file", label: "iCal file upload — static snapshot" },
                        { value: "third-party", label: "Via 3rd party (e.g. Google Calendar)" },
                    ]}
                />

                {method === "ical-url" && (
                    <div className="space-y-4">
                        <TextInput
                            label="iCal URL"
                            placeholder="https://yourschool.edu/cal/…"
                            value={icalUrl}
                            onChange={(e) => setIcalUrl(e.target.value)}
                            hint="Usually found in your timetable software's settings or sharing options."
                        />
                        <TextInput
                            label="Username"
                            placeholder="Your login username"
                            value={icalUsername}
                            onChange={(e) => setIcalUsername(e.target.value)}
                        />
                        <TextInput
                            label="Password"
                            type="password"
                            placeholder="Your login password"
                            value={icalPassword}
                            onChange={(e) => setIcalPassword(e.target.value)}
                        />
                    </div>
                )}

                {method === "ical-file" && (
                    <div className="space-y-3">
                        <Alert
                            variant="warning"
                            title="Static snapshot"
                            description="This file won't sync automatically. Room changes and new events won't appear until you re-upload."
                        />
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[11px] font-medium tracking-[0.1em] uppercase text-[var(--color-text-tertiary)]">
                                .ics file
                            </span>
                            <input
                                type="file"
                                accept=".ics"
                                className="text-sm text-[var(--color-text-secondary)] file:mr-3 file:rounded-[var(--radius-md)] file:border file:border-[var(--color-border)] file:bg-[var(--color-surface-raised)] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[var(--color-text-primary)] file:transition-colors hover:file:bg-[var(--color-muted)]"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const reader = new FileReader();
                                    reader.onload = (ev) =>
                                        setIcalData(ev.target?.result as string);
                                    reader.readAsText(file);
                                }}
                            />
                        </div>
                    </div>
                )}

                {method === "third-party" && (
                    <Alert
                        variant="info"
                        title="Third-party sync"
                        description="Sync your timetable to Google Calendar or another supported calendar app, then connect that calendar to Schoolm8 via iCal URL above."
                    />
                )}
            </div>
        </Modal>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
    const { user, loading, token } = useAuth();

    const [connected, setConnected] = useState<ConnectedServices>({
        canvas: false,
        googleClassroom: false,
        edumate: false,
        generic: false,
    });
    const [lmsLoading, setLmsLoading] = useState(true);
    const [timetableLoading, setTimetableLoading] = useState(true);

    const [canvasOpen, setCanvasOpen] = useState(false);
    const [classroomOpen, setClassroomOpen] = useState(false);
    const [edumateOpen, setEdumateOpen] = useState(false);
    const [genericOpen, setGenericOpen] = useState(false);

    useEffect(() => {
        if (loading || !user || !token) return;
        let cancelled = false;
        setLmsLoading(true);
        fetch("/api/lms/linked", { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => r.json())
            .then((d) => {
                if (cancelled) return;
                setConnected((p) => ({
                    ...p,
                    canvas: d.lms === "canvas",
                    googleClassroom: d.lms === "googleClassroom",
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

    useEffect(() => {
        if (loading || !user || !token) return;
        let cancelled = false;
        setTimetableLoading(true);
        fetch("/api/timetable/linked", { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => r.json())
            .then((d) => {
                if (cancelled) return;
                setConnected((p) => ({
                    ...p,
                    edumate: d.timetable === "edumate",
                    generic: d.timetable === "generic",
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

    useEffect(() => {
        if (typeof window === "undefined") return;
        const params = new URLSearchParams(window.location.search);
        if (params.get("oauthReturn") === "classroom") {
            setConnected((p) => ({ ...p, googleClassroom: true }));
            window.history.replaceState({}, "", "/settings/integrations");
        }
    }, []);

    const lmsLocked = connected.canvas || connected.googleClassroom;
    const timetableLocked = connected.edumate || connected.generic;

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

                {/* LMS */}
                <SectionLabel>Learning Management System</SectionLabel>
                <Text variant="bodySm" className="mb-4">
                    Link your LMS so Schoolm8 can pull assignments, announcements, and course data
                    automatically. Only one LMS can be connected at a time.
                </Text>

                {lmsLoading ? (
                    <div className="flex justify-center py-6">
                        <Spinner />
                    </div>
                ) : (
                    <div className="space-y-1">
                        {lmsLocked && (
                            <div className="mb-3 flex justify-end">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-[var(--color-danger)] hover:bg-[var(--color-danger-light)]"
                                    onClick={() =>
                                        setConnected((p) => ({
                                            ...p,
                                            canvas: false,
                                            googleClassroom: false,
                                        }))
                                    }
                                >
                                    Disconnect LMS
                                </Button>
                            </div>
                        )}
                        <IntegrationRow
                            icon={<SiCanvas className="h-5 w-5" />}
                            label="Canvas"
                            connected={connected.canvas}
                            locked={lmsLocked}
                            onClick={() => setCanvasOpen(true)}
                        />
                        <IntegrationRow
                            icon={<SiGoogleclassroom className="h-5 w-5" />}
                            label="Google Classroom"
                            connected={connected.googleClassroom}
                            locked={lmsLocked}
                            onClick={() => setClassroomOpen(true)}
                        />
                    </div>
                )}

                {/* Timetable */}
                <SectionLabel>Timetable</SectionLabel>
                <Text variant="bodySm" className="mb-4">
                    Connect your timetable provider for schedule views, class reminders, and
                    personalised study guides.
                </Text>

                {timetableLoading ? (
                    <div className="flex justify-center py-6">
                        <Spinner />
                    </div>
                ) : (
                    <div className="space-y-1">
                        {timetableLocked && (
                            <div className="mb-3 flex justify-end">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-[var(--color-danger)] hover:bg-[var(--color-danger-light)]"
                                    onClick={() =>
                                        setConnected((p) => ({
                                            ...p,
                                            edumate: false,
                                            generic: false,
                                        }))
                                    }
                                >
                                    Disconnect timetable
                                </Button>
                            </div>
                        )}
                        <IntegrationRow
                            icon={
                                <img
                                    src="https://edumate.com.au/favicon.ico"
                                    alt="Edumate"
                                    className="h-5 w-5"
                                    style={{
                                        filter: "invert(40%) sepia(60%) saturate(400%) hue-rotate(10deg)",
                                    }}
                                />
                            }
                            label="Edumate"
                            connected={connected.edumate}
                            locked={timetableLocked}
                            onClick={() => setEdumateOpen(true)}
                        />
                        <IntegrationRow
                            icon={<Table className="h-5 w-5" />}
                            label="Generic (iCal / file upload)"
                            connected={connected.generic}
                            locked={timetableLocked}
                            onClick={() => setGenericOpen(true)}
                        />
                    </div>
                )}
            </div>

            <CanvasModal
                open={canvasOpen}
                onClose={() => setCanvasOpen(false)}
                onConnected={() => setConnected((p) => ({ ...p, canvas: true }))}
                token={token}
            />
            <GoogleClassroomModal
                open={classroomOpen}
                onClose={() => setClassroomOpen(false)}
                token={token}
            />
            <EdumateModal
                open={edumateOpen}
                onClose={() => setEdumateOpen(false)}
                onConnected={() => setConnected((p) => ({ ...p, edumate: true }))}
                token={token}
            />
            <GenericModal
                open={genericOpen}
                onClose={() => setGenericOpen(false)}
                onConnected={() => setConnected((p) => ({ ...p, generic: true }))}
                token={token}
            />
        </div>
    );
}
