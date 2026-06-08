"use client";

import { useAuth } from "@/context/authContext";
import { useAccessControl } from "@/lib/access/useAccessControl";
import {
    Button,
    TextInput,
    Textarea,
    Select,
    Checkbox,
    Radio,
    Toggle,
    SearchInput,
    Card,
    CardHeader,
    CardTitle,
    CardSubtitle,
    CardBody,
    CardFooter,
    Badge,
    Avatar,
    AvatarGroup,
    Divider,
    Alert,
    Spinner,
    SpinnerOverlay,
    Skeleton,
    Progress,
    Table,
    Text,
    Tabs,
    TabList,
    Tab,
    TabPanel,
    Accordion,
    Tooltip,
    DropdownMenu,
    Modal,
    Drawer,
    EmptyState,
    Stat,
    Chip,
    Breadcrumb,
    List,
    Form,
    FormGroup,
    FormRow,
    FormSection,
    FormActions,
    PageSection,
} from "@/components/ui/components";
import { useState } from "react";

// ── small section wrapper ─────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-3">
            <p className="text-[11px] font-medium tracking-[0.1em] uppercase text-[var(--color-text-tertiary)] border-b border-[var(--color-border-subtle)] pb-2">
                {title}
            </p>
            {children}
        </div>
    );
}

export default function TestPage() {
    const { allowed, loading: accessLoading } = useAccessControl("test");
    const { token } = useAuth();

    // modal / drawer state
    const [modalOpen, setModalOpen] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);

    // search state
    const [search, setSearch] = useState("");

    // chips
    const [selectedChip, setSelectedChip] = useState<string | null>(null);
    const [chips, setChips] = useState(["Design", "Engineering", "Product", "Marketing"]);

    // toggle
    const [toggled, setToggled] = useState(false);

    if (accessLoading) return null;
    if (!allowed) return <div>Unauthorized</div>;

    const tableData = [
        { name: "Alice Chen", role: "Engineer", status: "active", score: 94 },
        { name: "Ben Okafor", role: "Designer", status: "idle", score: 81 },
        { name: "Cora Liu", role: "Product", status: "active", score: 88 },
        { name: "Dan Torres", role: "Manager", status: "away", score: 76 },
    ];

    const statusVariant: Record<string, "success" | "warning" | "danger" | "default"> = {
        active: "success",
        idle: "warning",
        away: "danger",
    };

    return (
        <main className="min-h-screen bg-[var(--color-surface)] font-[family-name:var(--font-body)]">
            {/* ── Header ── */}
            <div className="sticky top-0 z-10 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)]/90 backdrop-blur-md px-8 py-4 flex items-center justify-between">
                <div>
                    <Text variant="h4">Component Showcase</Text>
                    <Text variant="bodySm" className="mt-0.5">
                        All base components from{" "}
                        <Text as="code" variant="code">
                            components/ui/components.tsx
                        </Text>
                    </Text>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            fetch("http://localhost:3000/api/lms/sync", {
                                method: "GET",
                                headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${token}`,
                                },
                            })
                                .then((r) => r.json())
                                .then((d) => console.log("LMS Sync:", d))
                                .catch((e) => console.error("LMS Sync Error:", e));
                        }}
                    >
                        LMS Sync
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            fetch("http://localhost:3000/api/timetable/fetch", {
                                method: "GET",
                                headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${token}`,
                                },
                            })
                                .then((r) => r.json())
                                .then((d) => console.log("Timetable Sync:", d))
                                .catch((e) => console.error("Timetable Error:", e));
                        }}
                    >
                        Timetable Sync
                    </Button>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-8 py-10 space-y-14">
                {/* ── Breadcrumb ── */}
                <Breadcrumb
                    items={[{ label: "Home" }, { label: "Dev" }, { label: "Components" }]}
                />

                {/* ══════════════════════════════════════════════
                    TYPOGRAPHY
                ══════════════════════════════════════════════ */}
                <PageSection title="Typography">
                    <div className="space-y-3">
                        <Text variant="hero">
                            The editorial <em>serif voice</em>
                        </Text>
                        <Text variant="h1">Heading one — Instrument Serif</Text>
                        <Text variant="h2">
                            Heading two, <em>with italic</em>
                        </Text>
                        <Text variant="h3">Heading three</Text>
                        <Text variant="h4">Heading four</Text>
                        <Text variant="h5">Heading five</Text>
                        <Text variant="h6">Heading six</Text>
                        <Divider />
                        <Text variant="bodyLg">
                            Body large — DM Sans at 18px. Lead paragraph copy, intro sections, and
                            feature descriptions live here.
                        </Text>
                        <Text variant="body">
                            Body default at 16px. The workhorse of the system. Long-form reading,
                            card body copy, and general prose all use this scale.
                        </Text>
                        <Text variant="bodySm">
                            Body small at 14px — captions, secondary metadata, helper text.
                        </Text>
                        <Text variant="caption">Caption / 12px — timestamps, tags, hints</Text>
                        <Text variant="label">Label — uppercase tracking wide</Text>
                        <Text variant="code">const greeting = "hello world";</Text>
                    </div>
                </PageSection>

                {/* ══════════════════════════════════════════════
                    BUTTONS
                ══════════════════════════════════════════════ */}
                <PageSection title="Buttons">
                    <div className="space-y-6">
                        <Section title="Variants">
                            <div className="flex flex-wrap gap-3">
                                <Button variant="primary">Primary</Button>
                                <Button variant="secondary">Secondary</Button>
                                <Button variant="outline">Outline</Button>
                                <Button variant="ghost">Ghost</Button>
                                <Button variant="danger">Danger</Button>
                                <Button variant="success">Success</Button>
                                <Button variant="link">Link style</Button>
                            </div>
                        </Section>
                        <Section title="Sizes">
                            <div className="flex flex-wrap items-center gap-3">
                                <Button size="xs">Extra small</Button>
                                <Button size="sm">Small</Button>
                                <Button size="md">Medium</Button>
                                <Button size="lg">Large</Button>
                                <Button size="xl">Extra large</Button>
                            </div>
                        </Section>
                        <Section title="States">
                            <div className="flex flex-wrap gap-3">
                                <Button loading>Saving…</Button>
                                <Button disabled>Disabled</Button>
                                <Button
                                    variant="outline"
                                    leftIcon={
                                        <svg
                                            className="h-4 w-4"
                                            viewBox="0 0 16 16"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth={1.5}
                                        >
                                            <path d="M8 2v12M2 8h12" strokeLinecap="round" />
                                        </svg>
                                    }
                                >
                                    With icon
                                </Button>
                                <Tooltip content="Icon-only button">
                                    <Button
                                        variant="outline"
                                        iconOnly
                                        aria-label="Add"
                                        leftIcon={
                                            <svg
                                                className="h-4 w-4"
                                                viewBox="0 0 16 16"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth={1.5}
                                            >
                                                <path d="M8 2v12M2 8h12" strokeLinecap="round" />
                                            </svg>
                                        }
                                    />
                                </Tooltip>
                            </div>
                        </Section>
                    </div>
                </PageSection>

                {/* ══════════════════════════════════════════════
                    BADGES & CHIPS
                ══════════════════════════════════════════════ */}
                <PageSection title="Badges & Chips">
                    <div className="space-y-6">
                        <Section title="Badge variants">
                            <div className="flex flex-wrap gap-2">
                                <Badge>Default</Badge>
                                <Badge variant="primary">Primary</Badge>
                                <Badge variant="success" dot>
                                    Success
                                </Badge>
                                <Badge variant="warning" dot>
                                    Warning
                                </Badge>
                                <Badge variant="danger" dot>
                                    Danger
                                </Badge>
                                <Badge variant="info">Info</Badge>
                                <Badge variant="outline">Outline</Badge>
                                <Badge variant="success" pill>
                                    Pill success
                                </Badge>
                                <Badge variant="danger" pill dot>
                                    Pill + dot
                                </Badge>
                            </div>
                        </Section>
                        <Section title="Chips — click to select, × to remove">
                            <div className="flex flex-wrap gap-2">
                                {chips.map((c) => (
                                    <Chip
                                        key={c}
                                        selected={selectedChip === c}
                                        onClick={() =>
                                            setSelectedChip(selectedChip === c ? null : c)
                                        }
                                        onRemove={() =>
                                            setChips((prev) => prev.filter((x) => x !== c))
                                        }
                                    >
                                        {c}
                                    </Chip>
                                ))}
                            </div>
                        </Section>
                    </div>
                </PageSection>

                {/* ══════════════════════════════════════════════
                    AVATARS
                ══════════════════════════════════════════════ */}
                <PageSection title="Avatars">
                    <div className="space-y-6">
                        <Section title="Sizes">
                            <div className="flex items-end gap-4">
                                {(["xs", "sm", "md", "lg", "xl"] as const).map((s) => (
                                    <Avatar key={s} size={s} fallback="AC" alt="Alice Chen" />
                                ))}
                            </div>
                        </Section>
                        <Section title="With image & status">
                            <div className="flex items-center gap-4">
                                <Avatar
                                    src="https://i.pravatar.cc/80?img=1"
                                    alt="User"
                                    size="lg"
                                    status="online"
                                />
                                <Avatar fallback="BO" alt="Ben Okafor" size="lg" status="busy" />
                                <Avatar fallback="CL" alt="Cora Liu" size="lg" status="away" />
                                <Avatar fallback="DT" alt="Dan Torres" size="lg" status="offline" />
                            </div>
                        </Section>
                        <Section title="Group">
                            <AvatarGroup>
                                {["AC", "BO", "CL", "DT", "+3"].map((f) => (
                                    <Avatar key={f} fallback={f} size="sm" />
                                ))}
                            </AvatarGroup>
                        </Section>
                    </div>
                </PageSection>

                {/* ══════════════════════════════════════════════
                    FORM CONTROLS
                ══════════════════════════════════════════════ */}
                <PageSection title="Form Controls">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                        {/* Left column */}
                        <div className="space-y-5">
                            <Section title="Text inputs">
                                <TextInput label="Default input" placeholder="Enter value…" />
                                <TextInput
                                    label="With hint"
                                    placeholder="you@example.com"
                                    hint="We'll never share your email."
                                    type="email"
                                />
                                <TextInput
                                    label="Error state"
                                    placeholder="Enter value…"
                                    error="This field is required."
                                    defaultValue="bad input"
                                />
                                <TextInput label="Small" inputSize="sm" placeholder="Small input" />
                                <TextInput label="Large" inputSize="lg" placeholder="Large input" />
                            </Section>

                            <Section title="Search">
                                <SearchInput
                                    placeholder="Search anything…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onClear={() => setSearch("")}
                                />
                            </Section>

                            <Section title="Textarea">
                                <Textarea
                                    label="Message"
                                    placeholder="Write your message…"
                                    hint="Markdown supported."
                                />
                            </Section>
                        </div>

                        {/* Right column */}
                        <div className="space-y-5">
                            <Section title="Select">
                                <Select
                                    label="Choose framework"
                                    options={[
                                        { value: "", label: "Select one…" },
                                        { value: "next", label: "Next.js" },
                                        { value: "remix", label: "Remix" },
                                        { value: "astro", label: "Astro" },
                                    ]}
                                />
                            </Section>

                            <Section title="Checkbox & Radio">
                                <div className="space-y-2">
                                    <Checkbox
                                        label="Accept terms and conditions"
                                        hint="Required to continue."
                                        defaultChecked
                                    />
                                    <Checkbox label="Subscribe to newsletter" />
                                    <Checkbox label="Disabled option" disabled />
                                </div>
                                <Divider className="my-3" />
                                <div className="space-y-2">
                                    <Radio
                                        name="plan"
                                        label="Free plan"
                                        value="free"
                                        defaultChecked
                                    />
                                    <Radio name="plan" label="Pro plan" value="pro" />
                                    <Radio
                                        name="plan"
                                        label="Enterprise"
                                        value="enterprise"
                                        disabled
                                    />
                                </div>
                            </Section>

                            <Section title="Toggle">
                                <Toggle
                                    checked={toggled}
                                    onChange={setToggled}
                                    label={
                                        toggled ? "Notifications enabled" : "Notifications disabled"
                                    }
                                />
                            </Section>
                        </div>
                    </div>
                </PageSection>

                {/* ══════════════════════════════════════════════
                    FORM (composed)
                ══════════════════════════════════════════════ */}
                <PageSection title="Composed Form">
                    <Card>
                        <CardHeader>
                            <div>
                                <CardTitle>Account settings</CardTitle>
                                <CardSubtitle>Update your profile information</CardSubtitle>
                            </div>
                            <Badge variant="info">Draft</Badge>
                        </CardHeader>
                        <CardBody>
                            <Form>
                                <FormSection title="Personal details">
                                    <FormRow>
                                        <TextInput label="First name" placeholder="Alice" />
                                        <TextInput label="Last name" placeholder="Chen" />
                                    </FormRow>
                                    <TextInput
                                        label="Email"
                                        placeholder="alice@example.com"
                                        type="email"
                                    />
                                </FormSection>
                                <FormSection title="Preferences">
                                    <Select
                                        label="Language"
                                        options={[
                                            { value: "en", label: "English" },
                                            { value: "fr", label: "French" },
                                            { value: "de", label: "German" },
                                        ]}
                                    />
                                    <Checkbox label="Enable two-factor authentication" />
                                </FormSection>
                                <FormActions>
                                    <Button variant="ghost" type="button">
                                        Cancel
                                    </Button>
                                    <Button type="submit">Save changes</Button>
                                </FormActions>
                            </Form>
                        </CardBody>
                    </Card>
                </PageSection>

                {/* ══════════════════════════════════════════════
                    CARDS
                ══════════════════════════════════════════════ */}
                <PageSection title="Cards">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <Card>
                            <CardHeader>
                                <CardTitle>Default card</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Text variant="bodySm">
                                    Standard elevation with border. Use for most content blocks.
                                </Text>
                            </CardBody>
                            <CardFooter>
                                <Button variant="outline" size="sm">
                                    Cancel
                                </Button>
                                <Button size="sm">Confirm</Button>
                            </CardFooter>
                        </Card>

                        <Card variant="hoverable">
                            <CardHeader>
                                <CardTitle>Hoverable card</CardTitle>
                                <Badge variant="primary">New</Badge>
                            </CardHeader>
                            <CardBody>
                                <Text variant="bodySm">
                                    Lifts on hover with spring easing. Use for clickable cards.
                                </Text>
                            </CardBody>
                        </Card>

                        <Card variant="flat">
                            <CardHeader>
                                <CardTitle>Flat card</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Text variant="bodySm">
                                    No shadow, muted background. Use for nested or secondary
                                    content.
                                </Text>
                            </CardBody>
                        </Card>
                    </div>
                </PageSection>

                {/* ══════════════════════════════════════════════
                    STATS
                ══════════════════════════════════════════════ */}
                <PageSection title="Stat Cards">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <Stat
                            label="Total students"
                            value="1,284"
                            delta={{ value: "12% this month", direction: "up" }}
                            icon={
                                <svg
                                    className="h-5 w-5 text-[var(--color-primary)]"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path d="M9 6a3 3 0 1 1 6 0 3 3 0 0 1-6 0zm-5 7a5 5 0 0 1 10 0v1H4v-1z" />
                                </svg>
                            }
                        />
                        <Stat
                            label="Assignments due"
                            value="34"
                            delta={{ value: "5 overdue", direction: "down" }}
                        />
                        <Stat
                            label="Avg score"
                            value="82.4%"
                            delta={{ value: "Same as last week", direction: "neutral" }}
                        />
                        <Stat
                            label="Active courses"
                            value="8"
                            delta={{ value: "2 added", direction: "up" }}
                        />
                    </div>
                </PageSection>

                {/* ══════════════════════════════════════════════
                    ALERTS
                ══════════════════════════════════════════════ */}
                <PageSection title="Alerts">
                    <div className="space-y-3">
                        <Alert
                            variant="info"
                            title="Heads up"
                            description="LMS sync runs automatically every 30 minutes."
                            onClose={() => {}}
                        />
                        <Alert
                            variant="success"
                            title="Sync complete"
                            description="All 48 courses updated successfully."
                            onClose={() => {}}
                        />
                        <Alert
                            variant="warning"
                            title="Approaching limit"
                            description="Your storage is 85% full. Consider archiving old courses."
                        />
                        <Alert
                            variant="danger"
                            title="Sync failed"
                            description="Could not connect to LMS. Check your credentials and try again."
                            onClose={() => {}}
                        />
                    </div>
                </PageSection>

                {/* ══════════════════════════════════════════════
                    PROGRESS
                ══════════════════════════════════════════════ */}
                <PageSection title="Progress">
                    <div className="space-y-4 max-w-lg">
                        <Progress value={72} label="Course completion" showValue />
                        <Progress
                            value={45}
                            label="Assignment submissions"
                            showValue
                            variant="default"
                            size="lg"
                        />
                        <Progress value={91} label="Attendance" showValue variant="success" />
                        <Progress value={28} label="Storage used" showValue variant="danger" />
                    </div>
                </PageSection>

                {/* ══════════════════════════════════════════════
                    SPINNER & SKELETON
                ══════════════════════════════════════════════ */}
                <PageSection title="Spinners & Skeletons">
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                        <Section title="Spinners">
                            <div className="flex items-center gap-6">
                                {(["xs", "sm", "md", "lg", "xl"] as const).map((s) => (
                                    <Spinner key={s} size={s} />
                                ))}
                            </div>
                        </Section>
                        <Section title="Skeletons">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <Skeleton variant="avatar" width={40} height={40} />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton variant="text" width="60%" />
                                        <Skeleton variant="text" width="40%" />
                                    </div>
                                </div>
                                <Skeleton variant="text" lines={3} />
                                <Skeleton variant="button" width={120} />
                            </div>
                        </Section>
                    </div>
                </PageSection>

                {/* ══════════════════════════════════════════════
                    TABS
                ══════════════════════════════════════════════ */}
                <PageSection title="Tabs">
                    <div className="space-y-8">
                        <Section title="Pill tabs">
                            <Tabs defaultTab="overview">
                                <TabList>
                                    <Tab id="overview">Overview</Tab>
                                    <Tab id="grades">Grades</Tab>
                                    <Tab id="attendance">Attendance</Tab>
                                    <Tab id="settings" disabled>
                                        Settings
                                    </Tab>
                                </TabList>
                                <TabPanel id="overview">
                                    <Card variant="flat">
                                        <CardBody>
                                            <Text variant="bodySm">
                                                Overview panel content — assignments, recent
                                                activity, announcements.
                                            </Text>
                                        </CardBody>
                                    </Card>
                                </TabPanel>
                                <TabPanel id="grades">
                                    <Card variant="flat">
                                        <CardBody>
                                            <Text variant="bodySm">
                                                Grades panel — course scores, GPA breakdown.
                                            </Text>
                                        </CardBody>
                                    </Card>
                                </TabPanel>
                                <TabPanel id="attendance">
                                    <Card variant="flat">
                                        <CardBody>
                                            <Text variant="bodySm">
                                                Attendance panel — present, absent, late records.
                                            </Text>
                                        </CardBody>
                                    </Card>
                                </TabPanel>
                            </Tabs>
                        </Section>

                        <Section title="Underline tabs">
                            <Tabs defaultTab="a" variant="underline">
                                <TabList>
                                    <Tab id="a">Announcements</Tab>
                                    <Tab id="b">Assignments</Tab>
                                    <Tab id="c">Resources</Tab>
                                </TabList>
                                <TabPanel id="a">
                                    <Text variant="bodySm" className="pt-2">
                                        Announcements content.
                                    </Text>
                                </TabPanel>
                                <TabPanel id="b">
                                    <Text variant="bodySm" className="pt-2">
                                        Assignments content.
                                    </Text>
                                </TabPanel>
                                <TabPanel id="c">
                                    <Text variant="bodySm" className="pt-2">
                                        Resources content.
                                    </Text>
                                </TabPanel>
                            </Tabs>
                        </Section>
                    </div>
                </PageSection>

                {/* ══════════════════════════════════════════════
                    ACCORDION
                ══════════════════════════════════════════════ */}
                <PageSection title="Accordion">
                    <div className="max-w-2xl">
                        <Card>
                            <CardBody paddingless>
                                <Accordion
                                    allowMultiple
                                    items={[
                                        {
                                            id: "q1",
                                            title: "How does LMS sync work?",
                                            defaultOpen: true,
                                            content:
                                                "The LMS sync pulls your courses, assignments, and announcements from the connected platform every 30 minutes. You can also trigger a manual sync from the toolbar above.",
                                        },
                                        {
                                            id: "q2",
                                            title: "Can I customise the dashboard theme?",
                                            content:
                                                "Yes — head to Settings → Appearance. You can choose from Cream, Ember, Slate, and Parchment themes, or build your own via the CSS editor.",
                                        },
                                        {
                                            id: "q3",
                                            title: "What data does the timetable show?",
                                            content:
                                                "The timetable pulls your enrolled classes and their schedule from the school API. Both list and grid views are available.",
                                        },
                                    ]}
                                />
                            </CardBody>
                        </Card>
                    </div>
                </PageSection>

                {/* ══════════════════════════════════════════════
                    DIVIDERS
                ══════════════════════════════════════════════ */}
                <PageSection title="Dividers">
                    <div className="space-y-4 max-w-lg">
                        <Divider />
                        <Divider label="or continue with" />
                        <div className="flex h-12 items-center gap-3">
                            <span className="text-sm text-[var(--color-text-secondary)]">Left</span>
                            <Divider orientation="vertical" />
                            <span className="text-sm text-[var(--color-text-secondary)]">
                                Right
                            </span>
                        </div>
                    </div>
                </PageSection>

                {/* ══════════════════════════════════════════════
                    TABLE
                ══════════════════════════════════════════════ */}
                <PageSection title="Table">
                    <Table
                        keyExtractor={(r) => r.name}
                        columns={[
                            {
                                key: "name",
                                header: "Name",
                                render: (r) => (
                                    <div className="flex items-center gap-2">
                                        <Avatar fallback={r.name.slice(0, 2)} size="sm" />
                                        <span className="font-medium text-[var(--color-text-primary)]">
                                            {r.name}
                                        </span>
                                    </div>
                                ),
                            },
                            { key: "role", header: "Role", render: (r) => <Badge>{r.role}</Badge> },
                            {
                                key: "status",
                                header: "Status",
                                render: (r) => (
                                    <Badge variant={statusVariant[r.status]} dot>
                                        {r.status}
                                    </Badge>
                                ),
                            },
                            {
                                key: "score",
                                header: "Score",
                                render: (r) => (
                                    <div className="flex items-center gap-3 w-32">
                                        <Progress
                                            value={r.score}
                                            variant={
                                                r.score >= 85
                                                    ? "success"
                                                    : r.score >= 70
                                                      ? "default"
                                                      : "danger"
                                            }
                                        />
                                        <span className="text-xs text-[var(--color-text-secondary)] shrink-0">
                                            {r.score}%
                                        </span>
                                    </div>
                                ),
                            },
                        ]}
                        data={tableData}
                    />
                </PageSection>

                {/* ══════════════════════════════════════════════
                    LIST
                ══════════════════════════════════════════════ */}
                <PageSection title="List">
                    <div className="max-w-md">
                        <List
                            items={[
                                {
                                    id: 1,
                                    title: "Mathematics — Week 3 Quiz",
                                    subtitle: "Due Friday · 20 points",
                                    leading: <Avatar fallback="M" size="sm" />,
                                    trailing: <Badge variant="warning">Due soon</Badge>,
                                    onClick: () => {},
                                },
                                {
                                    id: 2,
                                    title: "English Literature — Essay",
                                    subtitle: "Due in 2 weeks · 100 points",
                                    leading: <Avatar fallback="E" size="sm" />,
                                    trailing: <Badge variant="default">Upcoming</Badge>,
                                    onClick: () => {},
                                },
                                {
                                    id: 3,
                                    title: "Physics Lab Report",
                                    subtitle: "Submitted · 96/100",
                                    leading: <Avatar fallback="P" size="sm" />,
                                    trailing: <Badge variant="success">Graded</Badge>,
                                    selected: true,
                                },
                            ]}
                        />
                    </div>
                </PageSection>

                {/* ══════════════════════════════════════════════
                    TOOLTIP & DROPDOWN
                ══════════════════════════════════════════════ */}
                <PageSection title="Tooltip & Dropdown">
                    <div className="flex flex-wrap gap-6 items-start">
                        <Section title="Tooltips">
                            <div className="flex gap-4 pt-4">
                                {(["top", "bottom", "left", "right"] as const).map((side) => (
                                    <Tooltip key={side} content={`Tooltip — ${side}`} side={side}>
                                        <Button variant="outline" size="sm">
                                            {side}
                                        </Button>
                                    </Tooltip>
                                ))}
                            </div>
                        </Section>
                        <Section title="Dropdown">
                            <DropdownMenu
                                trigger={<Button variant="outline">Open menu ↓</Button>}
                                items={[
                                    { separator: true, label: "Actions" },
                                    {
                                        label: "Edit profile",
                                        icon: (
                                            <svg
                                                className="h-4 w-4"
                                                viewBox="0 0 16 16"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth={1.5}
                                            >
                                                <path
                                                    d="M11 2a1.5 1.5 0 0 1 2.1 2.1L5 12.2l-3 .8.8-3L11 2z"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                        ),
                                        shortcut: "⌘E",
                                    },
                                    {
                                        label: "Duplicate",
                                        shortcut: "⌘D",
                                    },
                                    { separator: true },
                                    {
                                        label: "Delete",
                                        danger: true,
                                        icon: (
                                            <svg
                                                className="h-4 w-4"
                                                viewBox="0 0 16 16"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth={1.5}
                                            >
                                                <path
                                                    d="M3 4h10M6 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1M12 4l-.8 9H4.8L4 4"
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                        ),
                                    },
                                ]}
                            />
                        </Section>
                    </div>
                </PageSection>

                {/* ══════════════════════════════════════════════
                    MODAL & DRAWER
                ══════════════════════════════════════════════ */}
                <PageSection title="Modal & Drawer">
                    <div className="flex gap-3">
                        <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
                        <Button variant="outline" onClick={() => setDrawerOpen(true)}>
                            Open Drawer
                        </Button>
                    </div>

                    <Modal
                        open={modalOpen}
                        onClose={() => setModalOpen(false)}
                        title="Confirm action"
                        description="This will permanently delete the selected item."
                        footer={
                            <>
                                <Button variant="ghost" onClick={() => setModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button variant="danger" onClick={() => setModalOpen(false)}>
                                    Delete
                                </Button>
                            </>
                        }
                    >
                        <Alert
                            variant="warning"
                            title="This cannot be undone"
                            description="All associated data will be removed immediately."
                        />
                    </Modal>

                    <Drawer
                        open={drawerOpen}
                        onClose={() => setDrawerOpen(false)}
                        title="Notifications"
                        footer={
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDrawerOpen(false)}
                            >
                                Mark all as read
                            </Button>
                        }
                    >
                        <List
                            items={[
                                {
                                    id: 1,
                                    title: "LMS sync completed",
                                    subtitle: "2 minutes ago",
                                    leading: <Badge variant="success" dot />,
                                },
                                {
                                    id: 2,
                                    title: "Assignment graded",
                                    subtitle: "Physics Lab — 15 min ago",
                                    leading: <Badge variant="primary" dot />,
                                },
                                {
                                    id: 3,
                                    title: "New announcement",
                                    subtitle: "English Lit — 1 hour ago",
                                    leading: <Badge dot />,
                                },
                            ]}
                        />
                    </Drawer>
                </PageSection>

                {/* ══════════════════════════════════════════════
                    EMPTY STATE
                ══════════════════════════════════════════════ */}
                <PageSection title="Empty State">
                    <Card>
                        <CardBody>
                            <EmptyState
                                icon={
                                    <svg
                                        className="h-7 w-7 text-[var(--color-text-tertiary)]"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth={1.5}
                                    >
                                        <path
                                            d="M9 13h6m-3-3v6m-9 1V7a2 2 0 0 1 2-2h6l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                }
                                title="No assignments yet"
                                description="Assignments from your connected LMS will appear here once a sync completes."
                                actions={
                                    <>
                                        <Button variant="outline" size="sm">
                                            Learn more
                                        </Button>
                                        <Button size="sm">Sync now</Button>
                                    </>
                                }
                            />
                        </CardBody>
                    </Card>
                </PageSection>
            </div>
        </main>
    );
}
