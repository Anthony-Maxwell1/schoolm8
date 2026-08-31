// app/api/tasks/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

import { getUid } from "@/lib/access/auth";
export async function POST(req: NextRequest) {
    try {
        // Verify Authorization header
        const uid = getUid(req);

        const userRef = db.collection("users").doc(uid);
        const doc = await userRef.get();
        const data = doc.data();
        const executionsMap = data?.executions || {};

        const { tasks } = await req.json(); // expect [{id: string}]

        // Fetch each task from the user's executions subcollection
        const results = await Promise.all(
            tasks.map(async (task: { id: string }) => {
                if (!executionsMap[task.id]) {
                    return { id: task.id, status: "pending" };
                }
                return {
                    id: task.id,
                    status: executionsMap[task.id]?.status || "pending",
                };
            }),
        );

        return NextResponse.json(results);
    } catch (err) {
        console.error("Task status fetch error:", err);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
