"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/authContext";
import { db } from "@/lib/firebaseClient";
import { collection, doc, getDoc } from "firebase/firestore";

export default function CreateNotePage() {
    const { user, token } = useAuth();
    const [projects, setProjects] = useState<[string, string][]>([]);

    const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

    const fetchProjects = async () => {
        if (!user?.uid) return;
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
    };

    useEffect(() => {
        fetchProjects();
    }, [user]);

    const handleAddProject = () => {
        setSelectedProjects([...selectedProjects, ""]);
    };

    const handleRemoveProject = (index: number) => {
        setSelectedProjects(selectedProjects.filter((_, i) => i !== index));
    };

    const handleProjectChange = (index: number, value: string) => {
        const updated = [...selectedProjects];
        updated[index] = value;
        setSelectedProjects(updated);
    };

    const saveNote = async () => {
        const titleInput = document.getElementById("title") as HTMLInputElement | null;
        const contentInput = document.getElementById("content") as HTMLTextAreaElement | null;

        const title = titleInput?.value || "Untitled Note";
        const content = contentInput?.value || "";

        await fetch(`/api/notes/create?userId=${user?.uid}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                title,
                content,
                projects: selectedProjects,
            }),
        });
    };

    return (
        <div>
            <h1>Create Note</h1>
            <input
                id="title"
                type="text"
                placeholder="Untitled Note"
                className="border p-2 w-full mb-4"
            />
            <div className="mb-4">
                <label className="block mb-2 font-semibold">Projects</label>
                {selectedProjects.map((projectId, idx) => (
                    <div key={idx} className="flex items-center mb-2">
                        <select
                            className="border p-2 flex-1"
                            value={projectId}
                            onChange={(e) => handleProjectChange(idx, e.target.value)}
                        >
                            <option value="">Select a project</option>
                            {projects.map(([title, id]) => (
                                <option key={id} value={id}>
                                    {title}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            className="ml-2 text-red-500"
                            onClick={() => handleRemoveProject(idx)}
                            aria-label="Remove"
                        >
                            x
                        </button>
                    </div>
                ))}
                <button
                    type="button"
                    className="mt-2 px-2 py-1 bg-gray-200 rounded"
                    onClick={handleAddProject}
                >
                    + Add Project
                </button>
            </div>
            <textarea
                id="content"
                placeholder="Write your note here..."
                className="border p-2 w-full h-64"
            ></textarea>
            <button className="mt-4 px-4 py-2 text-white rounded" onClick={saveNote}>
                Save Note
            </button>
        </div>
    );
}
