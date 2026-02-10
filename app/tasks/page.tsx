"use client";
import { useAuth } from "@/context/authContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface FileMeta {
    id: string;
    name: string;
    size: number;
    contentType: string;
}

interface Task {
    title?: string;
    description?: string;
    assignments?: { assignmentId: string; courseId: string }[];
    files?: FileMeta[];
}

export default function Tasks() {
    const { user, token, loading } = useAuth();
    const router = useRouter();
    const [tasks, setTasks] = useState<Record<string, Task>>({});
    const [fetching, setFetching] = useState(true);

    // -----------------------------
    // Upload files for a task
    // -----------------------------
    // -----------------------------
    // Upload files for a task
    // -----------------------------
    const handleFileSelect = async (taskId: string, file: File) => {
        try {
            console.log(`Starting upload: ${file.name} (${file.size} bytes)`);
            const filePath = `/tasks/${taskId}/${file.name}`;

            const res = await fetch("/api/files/create", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "X-File-Path": filePath,
                    "Content-Type": file.type || "application/octet-stream",
                    "Content-Length": file.size.toString(), // Important: explicitly set Content-Length
                },
                body: file,
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to upload file");
            }

            const data = await res.json();
            console.log("Upload successful:", data);

            const newFile: FileMeta = {
                id: data.id || data.webUrl || data["@microsoft.graph.downloadUrl"],
                name: file.name,
                size: file.size,
                contentType: file.type,
            };

            setTasks((prev) => ({
                ...prev,
                [taskId]: {
                    ...prev[taskId],
                    files: [...(prev[taskId]?.files || []), newFile],
                },
            }));

            fetch("/api/tasks/update", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    id: taskId,
                    updated: {
                        ...tasks[taskId],
                        files: [...(tasks[taskId]?.files || []), newFile],
                    },
                }),
            });
        } catch (err) {
            console.error("Upload error:", err);
            alert(`Upload failed: ${err instanceof Error ? err.message : "Unknown error"}`);
        }
    };

    // -----------------------------
    // Submit task to Canvas
    // -----------------------------
    const submitTask = async (taskId: string) => {
        const task = tasks[taskId];
        if (!task) return;

        const files = task.files || [];
        const fileIds: string[] = [];

        // Upload each file to Canvas
        for (const file of files) {
            const uploadRes = await fetch("/api/canvas/assignments/upload", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: file.name,
                    size: file.size,
                    contentType: file.contentType,
                    onedrive: file.id,
                }),
            });

            const uploadData = await uploadRes.json();
            if (!uploadRes.ok) {
                alert(`Failed to upload ${file.name} to Canvas`);
                return;
            }

            fileIds.push(uploadData.fileId);
        }

        // Submit the assignments
        const assignments = task.assignments || [];
        for (const assignment of assignments) {
            const res = await fetch("/api/canvas/assignments/submit", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    assignmentId: assignment.assignmentId,
                    courseId: assignment.courseId,
                    files: fileIds.length > 0 ? fileIds : undefined,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                console.error(err);
                alert("Failed to submit assignment");
                return;
            }
        }

        fetch("/api/tasks/update", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                id: taskId,
                updated: {
                    ...tasks[taskId],
                    submitted: true,
                },
            }),
        });

        alert("Task submitted!");
    };

    // -----------------------------
    // Fetch tasks from backend
    // -----------------------------
    useEffect(() => {
        const fetchTasks = async () => {
            if (!token) return;

            try {
                setFetching(true);
                const res = await fetch("/api/tasks", {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await res.json();
                if (data.status === "ok") setTasks(data.tasks);
                else throw new Error(data.error || "Failed to fetch tasks");
            } catch (err) {
                console.error(err);
            } finally {
                setFetching(false);
            }
        };

        if (!loading) fetchTasks();
    }, [loading, token]);

    // -----------------------------
    // UI
    // -----------------------------
    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Tasks</h1>

            {loading || fetching ? (
                <p>Loading...</p>
            ) : Object.keys(tasks).length === 0 ? (
                <p>No tasks available.</p>
            ) : (
                <div className="space-y-4">
                    {Object.entries(tasks).map(([taskId, task]) => (
                        <div key={taskId} className="p-4 border rounded">
                            <h2 className="text-xl font-semibold">
                                {task.title || "Untitled Task"}
                            </h2>
                            <p>{task.description || "No description"}</p>

                            {/* File input */}
                            <label className="block mt-2">
                                <span className="text-sm font-medium">Upload Files</span>
                                <input
                                    type="file"
                                    multiple
                                    className="mt-1 block"
                                    onChange={(e) => {
                                        if (!e.target.files) return;
                                        Array.from(e.target.files).forEach((f) =>
                                            handleFileSelect(taskId, f),
                                        );
                                    }}
                                />
                            </label>

                            {/* Uploaded files */}
                            {task.files && task.files.length > 0 && (
                                <ul className="text-sm mt-2 text-gray-500">
                                    {task.files.map((f, i) => (
                                        <li key={i}>
                                            {f.name} ({Math.round(f.size / 1024)} KB)
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {/* Submit button */}
                            <button
                                onClick={() => submitTask(taskId)}
                                className="mt-3 px-4 py-2 bg-blue-500 text-white rounded"
                            >
                                Submit Task
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <a
                href="/tasks/create"
                className="mt-4 inline-block px-4 py-2 bg-green-500 text-white rounded"
            >
                Create Task
            </a>
        </div>
    );
}
