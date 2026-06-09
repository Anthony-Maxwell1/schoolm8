"use client";

import { db } from "@/lib/firebaseClient";
import { useAuth } from "@/context/authContext";
import { doc, getDoc, updateDoc, deleteField } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccessControl } from "@/lib/access/useAccessControl";
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    CardTitle,
    Chip,
    Divider,
    EmptyState,
    Form,
    FormActions,
    FormSection,
    Modal,
    Select,
    Skeleton,
    Spinner,
    Text,
    Textarea,
    TextInput,
    Alert,
} from "@/components/ui/components";
import Icon from "@/components/ui/icon";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Note {
    id: string;
    title: string;
    content: string;
    projects?: string[];
    updatedAt?: string;
    createdAt?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Note card skeleton
// ─────────────────────────────────────────────────────────────────────────────

function NoteCardSkeleton() {
    return (
        <Card variant="flat" className="p-5 space-y-3">
            <Skeleton variant="text" width="70%" height={22} />
            <Skeleton variant="text" lines={2} />
            <Skeleton variant="text" width="40%" height={14} />
        </Card>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function NotesPage() {
    const { allowed, loading: accessLoading } = useAccessControl("notes");
    const { user, token, loading } = useAuth();
    const router = useRouter();

    const [notes, setNotes] = useState<Note[]>([]);
    const [projects, setProjects] = useState<[string, string][]>([]); // [title, id]
    const [fetching, setFetching] = useState(true);

    // editor state
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [editorOpen, setEditorOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

    const titleRef = useRef<HTMLInputElement>(null);
    const contentRef = useRef<HTMLTextAreaElement>(null);

    // ── Fetch notes + projects ────────────────────────────────────────────
    useEffect(() => {
        if (loading || accessLoading || !allowed || !user) return;

        const fetchData = async () => {
            setFetching(true);
            try {
                const userRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(userRef);
                const data = docSnap.data()?.data;

                // notes
                const rawNotes = data?.notes;
                setNotes(
                    rawNotes
                        ? Object.entries(rawNotes).map(([id, n]: [string, any]) => ({
                            id,
                            ...n,
                        }))
                        : [],
                );

                // projects
                const rawProjects = data?.projects;
                if (rawProjects) {
                    setProjects(
                        Object.entries(rawProjects).map(([key, value]: [string, any]) => [
                            value.title,
                            key,
                        ]),
                    );
                }
            } catch (err) {
                console.error("Failed to fetch notes:", err);
            } finally {
                setFetching(false);
            }
        };

        fetchData();
    }, [user, loading, accessLoading, allowed]);

    // ── Sync editor state when a note is selected ─────────────────────────
    useEffect(() => {
        if (!editingNote) return;
        setSelectedProjects(editingNote.projects ?? []);
        setSaveError(null);
        // Populate refs after modal renders
        setTimeout(() => {
            if (titleRef.current) titleRef.current.value = editingNote.title ?? "";
            if (contentRef.current) contentRef.current.value = editingNote.content ?? "";
        }, 0);
    }, [editingNote]);

    // ── Guards ────────────────────────────────────────────────────────────
    if (loading || accessLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface)]">
                <div className="flex flex-col items-center gap-4">
                    <Spinner size="lg" />
                    <Text variant="bodySm">Loading…</Text>
                </div>
            </div>
        );
    }

    if (!allowed) return <div>Unauthorized</div>;

    // ── Helpers ───────────────────────────────────────────────────────────
    const openEditor = (note: Note) => {
        setEditingNote(note);
        setEditorOpen(true);
    };

    const closeEditor = () => {
        setEditorOpen(false);
        setEditingNote(null);
    };

    const handleSave = async () => {
        if (!user || !editingNote) return;
        setSaving(true);
        setSaveError(null);
        try {
            const updated: Partial<Note> = {
                title: titleRef.current?.value || "Untitled Note",
                content: contentRef.current?.value || "",
                projects: selectedProjects.filter(Boolean),
                updatedAt: new Date().toISOString(),
            };

            await fetch(`/api/notes/update?userId=${user.uid}&noteId=${editingNote.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(updated),
            });

            // Optimistic update
            setNotes((prev) =>
                prev.map((n) =>
                    n.id === editingNote.id ? { ...n, ...updated } : n,
                ),
            );
            closeEditor();
        } catch (err) {
            setSaveError("Failed to save note. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!user || !editingNote) return;
        setDeleting(true);
        try {
            await fetch(`/api/notes/delete?userId=${user.uid}&noteId=${editingNote.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            setNotes((prev) => prev.filter((n) => n.id !== editingNote.id));
            setDeleteConfirmOpen(false);
            closeEditor();
        } catch (err) {
            console.error("Failed to delete note:", err);
        } finally {
            setDeleting(false);
        }
    };

    const addProject = () => setSelectedProjects((prev) => [...prev, ""]);
    const removeProject = (idx: number) =>
        setSelectedProjects((prev) => prev.filter((_, i) => i !== idx));
    const changeProject = (idx: number, value: string) =>
        setSelectedProjects((prev) => {
            const next = [...prev];
            next[idx] = value;
            return next;
        });

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <div className="mx-auto max-w-7xl px-6 py-10">

            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <Text variant="h2">Your Notes</Text>
                <Button
                    onClick={() => router.push("/notes/create")}
                    leftIcon={<Icon icon="plus" label="Create Note" color="--color-on-primary" />}
                    iconOnly
                    aria-label="Create note"
                />
            </div>

            <Divider className="my-6" />

            {/* ── Grid ── */}
            {fetching ? (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <NoteCardSkeleton key={i} />
                    ))}
                </div>
            ) : notes.length === 0 ? (
                <EmptyState
                    icon={<Icon icon="StickyNote" label="Sticky Note" />}
                    title="No notes yet"
                    description="Create your first note to get started."
                    actions={
                        <Button onClick={() => router.push("/notes/create")}>
                            Create note
                        </Button>
                    }
                />
            ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {notes.map((note) => (
                        <Card
                            key={note.id}
                            variant="hoverable"
                            onClick={() => openEditor(note)}
                        >
                            <CardHeader>
                                <CardTitle>{note.title || "Untitled Note"}</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Text variant="bodySm" className="line-clamp-3">
                                    {note.content || "No preview"}
                                </Text>
                                {note.updatedAt && (
                                    <Text variant="caption" className="mt-3 block">
                                        Updated{" "}
                                        {new Date(note.updatedAt).toLocaleDateString("en-AU", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </Text>
                                )}
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}

            {/* ── Delete confirm modal ── */}
            <Modal
                open={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                title="Delete note?"
                zIndex={500}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="danger" loading={deleting} onClick={handleDelete}>
                            Delete
                        </Button>
                    </>
                }
            >
                <Alert
                    variant="danger"
                    title="This cannot be undone"
                    description="The note will be permanently deleted."
                />
            </Modal>

            {/* ── Note editor modal ── */}
            <Modal
                open={editorOpen}
                onClose={closeEditor}
                title="Edit Note"
                description={
                    editingNote?.updatedAt
                        ? `Last updated ${new Date(editingNote.updatedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}`
                        : undefined
                }
                size="lg"
                footer={
                    <>
                        {/* Danger zone — left side */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="mr-auto text-[var(--color-danger)] hover:bg-[var(--color-danger-light)]"
                            onClick={() => setDeleteConfirmOpen(true)}
                        >
                            Delete note
                        </Button>

                        <Button variant="ghost" onClick={closeEditor}>
                            Cancel
                        </Button>
                        <Button loading={saving} onClick={handleSave}>
                            Save changes
                        </Button>
                    </>
                }
            >
                <Form>
                    {saveError && (
                        <Alert
                            variant="danger"
                            title="Save failed"
                            description={saveError}
                            onClose={() => setSaveError(null)}
                            className="mb-4"
                        />
                    )}

                    <FormSection title="Note details">
                        <TextInput
                            ref={titleRef}
                            label="Title"
                            placeholder="Untitled Note"
                            defaultValue={editingNote?.title ?? ""}
                        />
                        <Textarea
                            ref={contentRef}
                            label="Content"
                            placeholder="Write your note here…"
                            defaultValue={editingNote?.content ?? ""}
                            className="min-h-48"
                        />
                    </FormSection>

                    <FormSection title="Projects">
                        <div className="space-y-2">
                            {selectedProjects.map((projectId, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <div className="flex-1">
                                        <Select
                                            value={projectId}
                                            onChange={(e) => changeProject(idx, e.target.value)}
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
                                        onClick={() => removeProject(idx)}
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

                            {/* Selected chips */}
                            {selectedProjects.some(Boolean) && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {selectedProjects.filter(Boolean).map((id) => {
                                        const project = projects.find(([, pId]) => pId === id);
                                        return project ? (
                                            <Chip
                                                key={id}
                                                selected
                                                onRemove={() => {
                                                    const idx = selectedProjects.indexOf(id);
                                                    removeProject(idx);
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
                                onClick={addProject}
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
                    </FormSection>
                </Form>
            </Modal>
        </div>
    );
}