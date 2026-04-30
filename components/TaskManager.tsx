"use client";
import React, { useEffect, useRef } from "react";
import { Id, toast } from "react-toastify";
import { useAuth } from "@/context/authContext";

type StoredTask = {
    id: string;
    label: string;
    successlabel: string;
    faillabel: string;
    workinglabel: string;
    toastId: Id;
};

const STORAGE_KEY = "active_tasks";

function getStoredTasks(): StoredTask[] {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
        return [];
    }
}

function setStoredTasks(tasks: StoredTask[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export const TaskManager: React.FC = () => {
    const { user, loading, token } = useAuth();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const startPolling = (authToken: string) => {
        intervalRef.current = setInterval(async () => {
            stageTasks(authToken);

            const tasks = getStoredTasks();

            if (!tasks.length) return;

            try {
                const res = await fetch("/api/tasks/status", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${authToken}`,
                    },
                    body: JSON.stringify({ tasks }),
                });

                const statuses: { id: string; status: "pending" | "complete" | "failed" }[] =
                    await res.json();

                let updatedTasks = [...tasks];

                statuses.forEach((taskStatus) => {
                    const task = tasks.find((t) => t.id === taskStatus.id);
                    if (!task) return;

                    if (taskStatus.status === "complete") {
                        if (toast.isActive(task.toastId)) {
                            // Only update if it's still visible
                            toast.update(task.toastId, {
                                render: task.successlabel,
                                type: "success",
                                isLoading: false,
                                autoClose: 3000,
                            });
                        }

                        updatedTasks = updatedTasks.filter((t) => t.id !== task.id);
                    }

                    if (taskStatus.status === "failed") {
                        if (toast.isActive(task.toastId)) {
                            // Update existing toast
                            toast.update(task.toastId, {
                                render: task.faillabel,
                                type: "error",
                                isLoading: false,
                                autoClose: 5000,
                            });
                        } else {
                            // User dismissed it → show a NEW error toast
                            toast.error(task.faillabel);
                        }

                        updatedTasks = updatedTasks.filter((t) => t.id !== task.id);
                    }
                });

                setStoredTasks(updatedTasks);

                if (!updatedTasks.length && intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
            } catch (err) {
                console.error("Polling error:", err);
            }
        }, 2000);
    };

    const stageTasks = async (authToken: string) => {
        try {
            const res = await fetch("/api/tasks/todo", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
            });

            const tasks: {
                label: string;
                endpoint: string;
                method: "GET" | "POST";
                workinglabel: string;
                successlabel: string;
                faillabel: string;
            }[] = await res.json();

            let updated = [...getStoredTasks()];

            if (!tasks || !Array.isArray(tasks)) {
                return;
            }
            for (const task of tasks) {
                try {
                    const stageRes = await fetch("/api/tasks/stage", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${authToken}`,
                        },
                        body: JSON.stringify(task),
                    });

                    const { id } = await stageRes.json();
                    const searchParams = new URL(task.endpoint, window.location.origin)
                        .searchParams;
                    searchParams.set("taskId", id);
                    const endpoint = `${new URL(task.endpoint, window.location.origin).pathname}?${searchParams.toString()}`;
                    fetch(endpoint, {
                        method: task.method,
                        headers: { Authorization: `Bearer ${authToken}` },
                    });

                    const toastId = toast.loading(task.workinglabel, {
                        closeOnClick: true,
                        closeButton: true,
                        draggable: true,
                    });

                    updated.push({
                        id,
                        label: task.label,
                        successlabel: task.successlabel,
                        faillabel: task.faillabel,
                        workinglabel: task.workinglabel,
                        toastId,
                    });
                } catch (err) {
                    console.error("Stage error:", err);
                }
            }

            setStoredTasks(updated);

            if (updated.length) startPolling(authToken);
        } catch (err) {
            console.error("Todo fetch error:", err);
        }
    };

    useEffect(() => {
        if (loading || !user || !token) return;

        let existing = getStoredTasks();

        if (existing.length) {
            existing.forEach((v, i) => {
                existing[i].toastId = toast.loading(v.workinglabel, {
                    closeOnClick: true,
                    closeButton: true,
                    draggable: true,
                });
            });
            setStoredTasks(existing);
        }

        startPolling(token);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [loading, user, token]);

    return null; // background component, no UI
};
