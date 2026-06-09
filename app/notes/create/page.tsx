"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/authContext";
import { db } from "@/lib/firebaseClient";
import { collection, doc, getDoc } from "firebase/firestore";
import { useAccessControl } from "@/lib/access/useAccessControl";
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    CardSubtitle,
    CardTitle,
    Form,
    FormActions,
    FormSection,
    TextInput,
    Textarea,
    Select,
    Chip,
    Skeleton,
} from "@/components/ui/components";
import { useRouter } from "next/dist/client/components/navigation";

export default function CreateNotePage() {
    const { allowed, loading: accessLoading } = useAccessControl("notes/create");
    const { user, token } = useAuth();
    const router = useRouter();

    const [projects, setProjects] = useState<[string, string][]>([]);
    const [projectsLoading, setProjectsLoading] = useState(true);
    const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    const titleRef = useRef<HTMLInputElement>(null);
    const contentRef = useRef<HTMLTextAreaElement>(null);

    const fetchProjects = async () => {
        if (!user?.uid) return;
        setProjectsLoading(true);
        try {
            const userRef = doc(collection(db, "users"), user.uid);
            const docSnap = await getDoc(userRef);
            if (!docSnap.exists()) return;
            const data = docSnap.data()?.data?.projects;
            if (data) {
                const dataArray: [string, string][] = Object.entries(data).map(
                    ([key, value]: [string, any]) => [value.title, key],
                );
                setProjects(dataArray);
            }
        } finally {
            setProjectsLoading(false);
        }
    };

    useEffect(() => {
        if (accessLoading || !allowed) return;
        fetchProjects();
    }, [user, accessLoading, allowed]);

    if (accessLoading) return <div className="min-h-screen" />;
    if (!allowed) return <div>Unauthorized</div>;

    // ── Project list helpers ──────────────────────────────────────────────
    const handleAddProject = () => {
        setSelectedProjects((prev) => [...prev, ""]);
    };

    const handleRemoveProject = (index: number) => {
        setSelectedProjects((prev) => prev.filter((_, i) => i !== index));
    };

    const handleProjectChange = (index: number, value: string) => {
        setSelectedProjects((prev) => {
            const updated = [...prev];
            updated[index] = value;
            return updated;
        });
    };

    // ── Save ─────────────────────────────────────────────────────────────
    const saveNote = async () => {
        setSaving(true);
        try {
            await fetch(`/api/notes/create?userId=${user?.uid}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: titleRef.current?.value || "Untitled Note",
                    content: contentRef.current?.value || "",
                    projects: selectedProjects.filter(Boolean),
                }),
            });
            router.push("/notes");
        } finally {
            setSaving(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <div className="mx-auto max-w-2xl px-6 py-8">
            <Card>
                <CardHeader>
                    <div>
                        <CardTitle>Create Note</CardTitle>
                        <CardSubtitle>Write and organise a new note</CardSubtitle>
                    </div>
                </CardHeader>
                <CardBody>
                    <Form onSubmit={saveNote}>
                        <FormSection title="Note details">
                            <TextInput
                                ref={titleRef}
                                label="Title"
                                placeholder="Untitled Note"
                            />
                            <Textarea
                                ref={contentRef}
                                label="Content"
                                placeholder="Write your note here…"
                                className="min-h-48"
                            />
                        </FormSection>

                        {/* ── Projects ── */}
                        <FormSection title="Projects">
                            {projectsLoading ? (
                                <div className="space-y-2">
                                    <Skeleton variant="button" height={40} />
                                    <Skeleton variant="button" height={40} />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {selectedProjects.map((projectId, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <div className="flex-1">
                                                <Select
                                                    value={projectId}
                                                    onChange={(e) =>
                                                        handleProjectChange(idx, e.target.value)
                                                    }
                                                    options={[
                                                        { value: "", label: "Select a project…" },
                                                        ...projects.map(([title, id]) => ({
                                                            value: id,
                                                            label: title,
                                                        })),
                                                    ]}
                                                />
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                iconOnly
                                                aria-label="Remove project"
                                                onClick={() => handleRemoveProject(idx)}
                                                leftIcon={
                                                    <svg
                                                        className="h-4 w-4"
                                                        viewBox="0 0 16 16"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth={1.5}
                                                        strokeLinecap="round"
                                                    >
                                                        <path d="M4 4l8 8M12 4l-8 8" />
                                                    </svg>
                                                }
                                            />
                                        </div>
                                    ))}

                                    {/* Selected project chips */}
                                    {selectedProjects.some(Boolean) && (
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                            {selectedProjects
                                                .filter(Boolean)
                                                .map((id) => {
                                                    const project = projects.find(([, pId]) => pId === id);
                                                    return project ? (
                                                        <Chip
                                                            key={id}
                                                            selected
                                                            onRemove={() => {
                                                                const idx = selectedProjects.indexOf(id);
                                                                handleRemoveProject(idx);
                                                            }}
                                                        >
                                                            {project[0]}
                                                        </Chip>
                                                    ) : null;
                                                })}
                                        </div>
                                    )}

                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleAddProject}
                                        leftIcon={
                                            <svg
                                                className="h-4 w-4"
                                                viewBox="0 0 16 16"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth={1.5}
                                                strokeLinecap="round"
                                            >
                                                <path d="M8 2v12M2 8h12" />
                                            </svg>
                                        }
                                    >
                                        Add project
                                    </Button>
                                </div>
                            )}
                        </FormSection>

                        <FormActions>
                            <Button
                                variant="ghost"
                                type="button"
                                onClick={() => router.push("/notes")}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" loading={saving}>
                                Save note
                            </Button>
                        </FormActions>
                    </Form>
                </CardBody>
            </Card>
        </div>
    );
}