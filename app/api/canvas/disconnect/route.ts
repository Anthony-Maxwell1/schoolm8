import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { getUid } from "@/lib/access/auth";
export async function GET(req: Request) {
    try {
        const userId = getUid(req);

        const userRef = db.collection("users").doc(userId);
        const doc = await userRef.get();
        if (!doc.exists) throw new Error("User not found");

        // Remove Canvas info
        await userRef.set(
            {
                canvasToken: null,
                info: {
                    canvasBaseUrl: null,
                },
            },
            { merge: true },
        );
        return NextResponse.json({ message: "Canvas disconnected successfully" });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Internal Server Error" },
            { status: 500 },
        );
    }
}
