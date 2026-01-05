import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";
import { db, auth } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
    try {
        const { task } = await req.json();
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
        }

        const idToken = authHeader.split(" ")[1];
        if (!idToken) throw new Error("Missing authentication token");
        if (!task) throw new Error("Missing task data");

        const decoded = await auth.verifyIdToken(idToken);
        const userId = decoded.uid;

        const userRef = db.collection("users").doc(userId);
        const doc = await userRef.get();
        if (!doc.exists) throw new Error("User not found");

        const id = uuidv4();

        const newTask = {
            ...task,
            id,
        };

        await userRef.update({
            [`data.tasks.${id}`]: newTask,
        });
        return NextResponse.json({ status: "ok", id });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
