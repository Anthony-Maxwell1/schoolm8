import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

import { getUid } from "@/lib/access/auth";
export async function DELETE(req: Request) {
    try {
        // ---------- AUTHENTICATION ----------
        const authedUserId = getUid(req);

        // ---------- QUERY PARAMS ----------
        const url = new URL(req.url);
        const noteId = url.searchParams.get("noteId");

        if (!noteId) throw new Error("Missing noteId");

        const userRef = db.collection("users").doc(authedUserId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) throw new Error("User not found");

        const oldNote = userDoc.get(`data.notes.${noteId}`);
        if (!oldNote) throw new Error("Note not found");
        await userRef.delete(oldNote);

        return NextResponse.json({ status: "ok", noteId });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
