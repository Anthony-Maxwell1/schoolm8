import { NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import { v4 as uuidv4, v4 } from "uuid";

export async function POST(req: Request) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer "))
        return NextResponse.json(
            { error: "Missing or invalid Authorization header" },
            { status: 401 },
        );

    const idToken = authHeader.split(" ")[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;
    const userRef = db.collection("users").doc(userId);
    const doc = await userRef.get();
    if (!doc.exists) throw new Error("User not found");

    const data = await req.json();

    const state = userId + "." + v4();
    await userRef.set(
        {
            currentState: {
                state,
                createdAt: new Date(),
                data: data,
            },
        },
        { merge: true },
    );

    return NextResponse.json({ state });
}
