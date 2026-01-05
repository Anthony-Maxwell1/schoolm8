import { NextResponse } from "next/server";
import { db, auth } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
    try {
        const { assessmentId, taskId, updated } = await req.json();

        if (!taskId && !assessmentId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // --- AUTH ---
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
        }

        const idToken = authHeader.split(" ")[1];
        const decoded = await auth.verifyIdToken(idToken);
        const userId = decoded.uid;

        // --- FETCH USER ---
        const userRef = db.collection("users").doc(userId);
        const doc = await userRef.get();

        if (!doc.exists) throw new Error("User not found");

        const id = assessmentId || `ASSESSMENT_${taskId}`;

        // --- FETCH TASK ---
        const task = doc.get(`data.tasks.${id}`);

        if (!task) {
            throw new Error("Task not found");
        }

        // --- CREATE ASSESSMENT ---
        const taskData = {
            ...task,
            ...updated,
            updatedAt: new Date().toISOString(),
        };

        await userRef.update({
            [`data.tasks.${id}`]: taskData,
        });

        return NextResponse.json({ status: "ok" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
