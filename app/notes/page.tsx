"use client";

import { db } from "@/lib/firebaseClient";
import { useAuth } from "@/context/authContext";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StickyNote, Plus } from "lucide-react";
import Link from "next/link";

export default function NotesPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [notes, setNotes] = useState<any[]>([]);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.push("/signin");
            return;
        }

        const fetchNotes = async () => {
            try {
                setFetching(true);
                const notesRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(notesRef);
                const data = docSnap.data()?.data.notes;
                setNotes(data ? Object.values(data) : []);
            } catch (err) {
                console.error("Failed to fetch notes:", err);
            } finally {
                setFetching(false);
            }
        };

        fetchNotes();
    }, [user, loading, router]);

    return (
        <div className="max-w-7xl mx-auto px-6 py-12 bg-white text-slate-900">
            <div className="mb-8">
                <Link
                    href="/notes/create"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors font-semibold shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    Create Note
                </Link>
            </div>

            {fetching ? (
                <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
                        <p className="text-slate-600">Loading notes...</p>
                    </div>
                </div>
            ) : notes.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <StickyNote className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-semibold text-slate-900 mb-2">No notes yet</h2>
                        <p className="text-slate-600 mb-6">Create your first note to get started</p>
                        <Link
                            href="/notes/create"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors font-semibold shadow-sm"
                        >
                            <Plus className="w-5 h-5" />
                            Create Note
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {notes.map((note: any, idx: number) => (
                        <div
                            key={idx}
                            className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg p-6 cursor-pointer"
                        >
                            <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-emerald-700 transition-colors line-clamp-2">
                                {note.title || "Untitled Note"}
                            </h3>
                            <p className="text-sm text-slate-600 line-clamp-3">
                                {note.content || note.description || "No preview"}
                            </p>
                            {note.updatedAt && (
                                <p className="text-xs text-slate-500 mt-4">
                                    Updated: {new Date(note.updatedAt).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
