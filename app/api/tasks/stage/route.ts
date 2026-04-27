// app/api/tasks/stage/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import { assertAccess } from "@/lib/access/serverAccessControl";

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
        }

        const idToken = authHeader.split(" ")[1];
        const decoded = await auth.verifyIdToken(idToken);
        const uid = decoded.uid;

        const accessResult = await assertAccess(uid, ["api/tasks/*", "apiAccessLevel0"]);

        if (accessResult.status !== 200) {
            return new Response(JSON.stringify({ error: accessResult.body!.error }), {
                status: accessResult.status,
            });
        }

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
