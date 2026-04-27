// app/api/tasks/todo/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import { assertAccess } from "@/lib/access/ServerAccessControl";

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
        }

        const idToken = authHeader.split(" ")[1];
        const decoded = await auth.verifyIdToken(idToken);
        const uid = decoded.uid;
        const result = await assertAccess(uid, ["api/tasks/*", "apiAccessLevel0"]);

        if (result.status !== 200) {
            return new Response(JSON.stringify({ error: result.body!.error }), {
                status: result.status,
            });
        }

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
