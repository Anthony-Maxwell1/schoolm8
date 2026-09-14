// app/api/tasks/todo/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

import { getUid } from "@/lib/access/auth";
export async function GET(req: NextRequest) {
    try {
        const uid = getUid(req);

        const userRef = db.collection("users").doc(uid);
        const doc = await userRef.get();

        if (!doc.exists) {
            return NextResponse.json([]);
        }

        const data = doc.data();
        const tasksMap = data?.data?.tasks || {};

        const now = Date.now();

        const dueTasks = Object.entries(tasksMap)
            .map(([id, task]: [string, any]) => ({
                id,
                ...task,
            }))
            .filter((task) => {
                if (!task.enabled) return false;
                const lastRun = task.lastRun || 0;
                return now - lastRun >= task.wait * 1000;
            });

        return NextResponse.json(dueTasks);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
