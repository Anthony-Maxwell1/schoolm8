import { NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
    try {
        // ---------- AUTHENTICATION ----------
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
        }

        const idToken = authHeader.split(" ")[1];

        // Verify Firebase token
        const decoded = await auth.verifyIdToken(idToken);
        const authedUserId = decoded.uid;

        // ---------- QUERY PARAMS ----------
        const url = new URL(req.url);
        const userId = url.searchParams.get("userId");
        const noteId = url.searchParams.get("noteId");

        if (!userId) throw new Error("Missing userId");
        if (!noteId) throw new Error("Missing noteId");

        // Prevent user editing someone else's data
        if (authedUserId !== userId) {
            return NextResponse.json(
                { error: "Unauthorized: cannot modify another user's notes" },
                { status: 403 },
            );
        }

        // ---------- FETCH BODY ----------
        const { title, content, projects, assignments } = await req.json();

        if (!title) throw new Error("Missing title");
        if (!content) throw new Error("Missing content");

        const userRef = db.collection("users").doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) throw new Error("User not found");

        const oldNote = userDoc.get(`data.notes.${noteId}`);
        if (!oldNote) throw new Error("Note not found");

        const newNote = {
            title,
            content,
            projects: projects || [],
            assignments: assignments || [],
            created: oldNote.created,
            updated: Date.now(),
        };

        // ---------- UPDATE ----------
        await userRef.update({
            [`data.notes.${noteId}`]: newNote,
        });

        return NextResponse.json({ status: "ok", noteId });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
