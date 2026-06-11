"use client";

import { useState, useEffect } from "react";
import { Assignment, normaliseAssignment } from "@/lib/lmsNormaliser";
import { useAuth } from "@/context/authContext";
import { useParams } from "next/navigation";
import { ClassroomAssignment } from "@/app/api/googleclassroom/sync/route";
import { LMSAssignment } from "@/app/api/canvas/sync/route";
import { useAccessControl } from "@/lib/access/useAccessControl";
import {
    Card, CardBody, CardHeader, CardTitle,
    Badge, Skeleton, Text, Divider, Alert,
} from "@/components/ui/components";
import { Clock, BookOpen, ArrowLeft, ExternalLink } from "lucide-react";

function getMaxRows(obj: Record<string, any[]>) {
    return Math.max(...Object.values(obj).map((arr) => arr.length));
}

const SOURCE_LABEL: Record<string, string> = {
    classroom: "Google Classroom",
    canvas: "Canvas",
    moodle: "Moodle",
};

export default function AssignmentPage({ params }: { params: { id: string; cameFrom: string } }) {
    const { id } = useParams();
    const { allowed, loading: accessLoading } = useAccessControl("lms/assignment/[id]");
    const { user, token, loading } = useAuth();
    const [data, setData] = useState<Assignment | null>(null);
    const [fetching, setFetching] = useState(true);

    const headers = data?.rubric ? Object.keys(data.rubric) : [];
    const maxRows = data?.rubric ? getMaxRows(data.rubric) : 0;

    useEffect(() => {
        if (loading || accessLoading || !allowed || !user || !token) return;
        fetch("/api/lms/assignments", { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => r.json())
            .then((res) => {
                if (res.error === "NEXT_REDIRECT") { window.location.href = "/lms"; return; }
                const found = (Object.values(res.assignments) as (ClassroomAssignment | LMSAssignment)[]).find((a) => a.id === id);
                if (found) setData(normaliseAssignment(found));
            })
            .catch(console.error)
            .finally(() => setFetching(false));
    }, [loading, user, token, id, accessLoading, allowed]);

    if (loading || accessLoading) return <div className="min-h-screen" />;
    if (!allowed) return <div>Unauthorized</div>;

    return (
        <div className="min-h-screen bg-[var(--color-surface)] px-6 py-10">
            <div className="mx-auto max-w-4xl space-y-6">

                {/* Back link */}
                <a
                    href={params.cameFrom ?? "/lms"}
                    className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-primary)]"
                >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                </a>

                {/* Header card */}
                <Card>
                    <CardBody>
                        {fetching ? (
                            <div className="space-y-4">
                                <Skeleton variant="text" width="30%" height={14} />
                                <Skeleton variant="text" width="70%" height={32} />
                                <Skeleton variant="text" width="40%" height={16} />
                                <Skeleton variant="text" lines={3} />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Meta row */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <Text variant="caption">{String(id)}</Text>
                                    {data?.source && (
                                        <Badge variant="info">{SOURCE_LABEL[data.source] ?? data.source}</Badge>
                                    )}
                                </div>

                                {/* Title */}
                                <h1 className="font-[family-name:var(--font-display)] text-3xl font-normal text-[var(--color-text-primary)] leading-snug">
                                    {data?.title ?? "Loading…"}
                                </h1>

                                {/* Course */}
                                {data?.courseName && (
                                    <Text variant="bodySm" className="flex items-center gap-1.5">
                                        <BookOpen className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
                                        {data.courseName}
                                    </Text>
                                )}

                                {/* Dates */}
                                <div className="flex flex-wrap gap-4 text-sm text-[var(--color-text-secondary)]">
                                    {data?.created && (
                                        <span className="flex items-center gap-1.5">
                                            <Clock className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
                                            Created {new Date(data.created).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                                        </span>
                                    )}
                                    {data?.dueAt && (
                                        <span className="flex items-center gap-1.5 font-medium text-[var(--color-danger)]">
                                            <Clock className="h-3.5 w-3.5" />
                                            Due {new Date(data.dueAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                                        </span>
                                    )}
                                </div>

                                {/* Description */}
                                {data?.description && (
                                    <>
                                        <Divider />
                                        <Text variant="body">{data.description}</Text>
                                    </>
                                )}

                                {/* Links */}
                                {data?.url && (
                                    <a
                                        href={data.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] underline-offset-4 hover:underline"
                                    >
                                        Open resource <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                )}
                            </div>
                        )}
                    </CardBody>
                </Card>

                {/* Rubric */}
                {data?.rubric && headers.length > 0 && maxRows > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Rubric</CardTitle>
                        </CardHeader>
                        <CardBody paddingless>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-sm">
                                    <thead>
                                        <tr className="border-b border-[var(--color-border)] bg-[var(--color-muted)]">
                                            {headers.map((h) => (
                                                <th key={h} className="px-4 py-3 text-left text-[11px] font-medium tracking-[0.08em] uppercase text-[var(--color-text-tertiary)]">
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--color-border-subtle)]">
                                        {Array.from({ length: maxRows }).map((_, row) => (
                                            <tr key={row} className="hover:bg-[var(--color-muted)] transition-colors">
                                                {headers.map((h) => (
                                                    <td key={h} className="px-4 py-3 text-[var(--color-text-primary)]">
                                                        {data.rubric![h][row] ?? ""}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardBody>
                    </Card>
                )}
            </div>
        </div>
    );
}