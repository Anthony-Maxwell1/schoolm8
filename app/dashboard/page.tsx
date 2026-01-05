"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/authContext";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

type Assignment = {
    id: string;
    title: string;
    description: string;
    dueAt: string | null;
    courseName: string;
};

type Note = {
    id: string;
    title: string;
    content: string;
    updated: string;
};

export default function Dashboard() {
    const { user, token, loading } = useAuth();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            // Fetch assignments
            const resAssignments = await fetch(`/api/canvas/assignments?uid=${user.uid}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const dataAssignments = await resAssignments.json();
            const upcoming: any[] = Object.values(dataAssignments)
                .sort((a: any, b: any) => {
                    const aTime = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
                    const bTime = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
                    return aTime - bTime;
                })
                .slice(0, 4);
            setAssignments(upcoming);

            const fetchNotes = async () => {
                try {
                    const notesRef = doc(db, "users", user.uid);
                    const docSnap = await getDoc(notesRef);
                    const data = docSnap.data()?.data.notes;
                    setNotes(data ? Object.values(data) : []);
                } catch (err) {
                    console.error("Failed to fetch notes:", err);
                } finally {
                }
            };

            fetchNotes();
        };

        fetchData();
    }, [user]);

    if (loading || !user) {
        return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
    }

    return (
        <div className="p-6 max-w-7xl mx-auto flex flex-col gap-8">
            <div className="flex justify-between items-center">
                <h1 className="text-4xl font-bold">Dashboard</h1>
                <Link href="/settings" className="text-gray-600 hover:text-gray-900 text-2xl">
                    ⚙️
                </Link>
            </div>

            {/* Top Section */}
            <div className="flex flex-row">
                <Card className="bg-white shadow-md">
                    <CardHeader>
                        <CardTitle>Sign In</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/signin">Go to Sign In</Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-md">
                    <CardHeader>
                        <CardTitle>Sign Up</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/signup">Go to Sign Up</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Upcoming Assignments */}
            <div>
                <h2 className="text-2xl font-semibold mb-4">Upcoming Assignments</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {assignments.map((a) => (
                        <Card
                            key={a.id}
                            className="bg-blue-50 shadow-sm hover:shadow-md transition"
                        >
                            <CardHeader>
                                <CardTitle className="text-lg font-medium">{a.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="text-gray-700">
                                <p className="truncate-3-lines">{a.description}</p>
                                <p className="mt-2 text-sm text-gray-500">{a.courseName}</p>
                                {a.dueAt && (
                                    <p className="mt-1 text-sm text-gray-600">
                                        Due: {format(new Date(a.dueAt), "dd/MM/yyyy HH:mm")}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Recent Notes */}
            <div>
                <h2 className="text-2xl font-semibold mb-4">Recent Notes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {notes.map((n) => (
                        <Card
                            key={n.id}
                            className="bg-green-50 shadow-sm hover:shadow-md transition"
                        >
                            <CardHeader>
                                <CardTitle className="text-lg font-medium">{n.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="text-gray-700">
                                <p className="truncate-3-lines">{n.content}</p>
                                <p className="mt-2 text-sm text-gray-500">
                                    Last updated: {format(new Date(n.updated), "dd/MM/yyyy HH:mm")}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
