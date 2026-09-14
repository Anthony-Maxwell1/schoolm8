import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { v4 as uuidv4, v4 } from "uuid";

import { getUid } from "@/lib/access/auth";
export async function POST(req: Request) {
    const userId = getUid(req);

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
