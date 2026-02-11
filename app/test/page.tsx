"use client";

import { useAuth } from "@/context/authContext";

export default function test() {
    const { user, token, loading } = useAuth();
    return (
        <main className="max-w-4xl mx-auto p-6 space-y-6">
            <h1 className="text-3xl font-bold">Test Page</h1>
            <p>This is a test page for development purposes.</p>
            <button
                onClick={() => {
                    fetch("http://localhost:3000/api/lms/sync", {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    })
                        .then((res) => res.json())
                        .then((data) => {
                            console.log("LMS Sync Response:", data);
                        })
                        .catch((err) => {
                            console.error("LMS Sync Error:", err);
                        });
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                Test LMS Sync
            </button>
        </main>
    );
}
