import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { v4 as uuidv4 } from "uuid";

import { getUid } from "@/lib/access/auth";
export async function GET(req: Request) {
    try {
        // ---------- AUTH CHECK ----------
        const authedUserId = getUid(req);

        // ---------- QUERY PARAMS ----------
        const url = new URL(req.url);
        const userId = url.searchParams.get("userId");
        const assignments = url.searchParams.getAll("assignment") || [];
        const title = url.searchParams.get("title");
        const description = url.searchParams.get("description") || "";
        const due = url.searchParams.get("due") || null;

        if (!userId) {
            return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        }

        if (!title) {
            return NextResponse.json({ error: "Missing title" }, { status: 400 });
        }

        // ---------- PERMISSION CHECK ----------
        if (userId !== authedUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // ---------- CREATE PROJECT ----------
        const userRef = db.collection("users").doc(userId);
        const docSnap = await userRef.get();
        if (!docSnap.exists) throw new Error("User not found");

        const projectId = uuidv4();
        const now = Date.now();
        const newProject = {
            title,
            description,
            assignments,
            due,
            created: now,
            updated: now,
            files: [],
            notes: [],
        };

        await userRef.update({
            [`data.projects.${projectId}`]: newProject,
        });

        return NextResponse.json({ status: "ok", projectId });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
