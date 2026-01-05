import { NextResponse } from "next/server";
import { db, auth } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
    try {
        const { taskId, type, aiLevel, projects, assignments } = await req.json();

        if (!taskId || !type) {
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

        // --- FETCH TASK ---
        const task = doc.get(`data.tasks.${taskId}`);

        if (!task) {
            throw new Error("Task not found");
        }

        // --- CREATE ASSESSMENT ---
        const assessment = {
            ...task,
            type,
            assessmentCreatedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: type === "test" ? "upcoming" : "incomplete",
            ...(type === "test" ? { studyPlan: [] } : {}),
            aiLevel: aiLevel ?? (type === "test" ? "full" : "none"),
            projects: projects || [],
            assignments: [...(task.assignments || []), ...(assignments || [])],
        };

        // --- UPDATE ORIGINAL TASK ---
        const updatedTask = {
            ...task,
            assessmentId: `ASSESSMENT_${taskId}`,
        };

        await userRef.update({
            [`data.tasks.ASSESSMENT_${taskId}`]: assessment,
            [`data.tasks.${taskId}`]: updatedTask,
        });

        return NextResponse.json({ status: "ok" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
