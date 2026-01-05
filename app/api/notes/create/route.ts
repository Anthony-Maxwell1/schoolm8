import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { auth, db } from "@/lib/firebaseAdmin";
import Assignments from "@/app/assignments/page";

export async function POST(req: Request) {
    try {
        // ---------- AUTH CHECK ----------
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
        }

        const idToken = authHeader.split(" ")[1];
        const decoded = await auth.verifyIdToken(idToken);
        const authedUserId = decoded.uid;

        // ---------- QUERY PARAMS ----------
        const url = new URL(req.url);
        const userId = url.searchParams.get("userId");

        if (!userId) throw new Error("Missing userId");

        // Prevent a user from writing to another user's document
        if (userId !== authedUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // ---------- BODY ----------
        const { title, content, projects, assignments } = await req.json();

        if (!title) throw new Error("Missing title");
        if (!content) throw new Error("Missing content");

        const noteId = uuidv4();
        const now = Date.now();

        const newNote = {
            title,
            content,
            projects: projects || [],
            assignments: assignments || [],
            created: now,
            updated: now,
        };

        const userRef = db.collection("users").doc(userId);
        const docSnap = await userRef.get();

        if (!docSnap.exists) throw new Error("User not found");

        // ---------- UPDATE ----------
        await userRef.update({
            [`data.notes.${noteId}`]: newNote,
        });

        return NextResponse.json({ status: "ok", noteId });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
