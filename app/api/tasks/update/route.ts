import { NextResponse } from "next/server";
import { db, auth } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const { id, updated } = await req.json();
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
    }

    const idToken = authHeader.split(" ")[1];
    if (!idToken) throw new Error("Missing authentication token");
    if (!id || !updated) throw new Error("Missing task data or id");

    const decoded = await auth.verifyIdToken(idToken);
    const userId = decoded.uid;

    const userRef = db.collection("users").doc(userId);
    const doc = await userRef.get();
    if (!doc.exists) throw new Error("User not found");

    const taskRef = doc.get(`data.tasks.${id}`);
    if (!taskRef) throw new Error("Task not found");

    const newTask = {
      ...taskRef,
      ...updated,
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
