import { NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import { assertAccess } from "@/lib/access/serverAccessControl";

export async function DELETE(req: Request) {
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

        const accessResult = await assertAccess(authedUserId, ["api/notes/*", "apiAccessLevel0"]);

        if (accessResult.status !== 200) {
            return new Response(JSON.stringify({ error: accessResult.body!.error }), {
                status: accessResult.status,
            });
        }

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

        const userRef = db.collection("users").doc(userId);
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
