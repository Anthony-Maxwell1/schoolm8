import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { v4 as uuidv4 } from "uuid";

import { getUid } from "@/lib/access/auth";
export async function GET(req: Request) {
    try {
        // ---------- AUTH CHECK ----------
        const uid = getUid(req);

        // ---------- QUERY PARAMS ----------
        const url = new URL(req.url);
        const assignments = url.searchParams.getAll("assignment") || [];
        const classes = url.searchParams.getAll("class") || [];
        const title = url.searchParams.get("title");
        const description = url.searchParams.get("description") || "";
        const due = url.searchParams.get("due") || null;

        if (!title) {
            return NextResponse.json({ error: "Missing title" }, { status: 400 });
        }

        // ---------- CREATE PROJECT ----------
        const userRef = db.collection("users").doc(uid);
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
            classes: classes,
        };

        await userRef.update({
            [`data.projects.${projectId}`]: newProject,
        });

        return NextResponse.json({ status: "ok", projectId });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
