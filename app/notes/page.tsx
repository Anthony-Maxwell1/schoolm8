"use client";

import { db } from "@/lib/firebaseClient";
import { useAuth } from "@/context/authContext";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
        <div>
            <h1 className="text-2xl font-bold mb-4">Notes</h1>
            {}
        </div>
    );
}
