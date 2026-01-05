import { NextResponse } from "next/server";
import { db, auth } from "@/lib/firebaseAdmin";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
    }

    const idToken = authHeader.split(" ")[1];
    if (!idToken) throw new Error("Missing authentication token");

    const decoded = await auth.verifyIdToken(idToken);
    const userId = decoded.uid;

    const userRef = db.collection("users").doc(userId);
    const doc = await userRef.get();
    if (!doc.exists) throw new Error("User not found");

    const tasksRef = doc.get(`data.tasks`);

    return NextResponse.json({ status: "ok", tasks: tasksRef });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
