// app/api/tasks/stage/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

import { getUid } from "@/lib/access/auth";
export async function POST(req: NextRequest) {
    try {
        const uid = getUid(req);

        const { id } = await req.json();

        const userRef = db.collection("users").doc(uid);
        const executionId = crypto.randomUUID();

        await userRef.update({
            [`executions.${executionId}`]: {
                taskId: id,
                status: "pending",
                createdAt: Date.now(),
            },
            [`data.tasks.${id}.lastRun`]: Date.now(),
        });

        return NextResponse.json({ id: executionId });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
