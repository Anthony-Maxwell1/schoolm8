import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

import { getUid } from "@/lib/access/auth";
export async function POST(req: Request) {
    try {
        const userId = getUid(req);

        const userRef = db.collection("users").doc(userId);
        const doc = await userRef.get();
        if (!doc.exists) throw new Error("User not found");

        const { baseUrl, token } = await req.json();
        if (!baseUrl || !token) {
            return NextResponse.json({ error: "Missing baseUrl or token" }, { status: 400 });
        }

        // Verify Canvas token
        const verifyRes = await fetch(`${baseUrl}/api/v1/users/self`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (!verifyRes.ok) {
            const errorText = await verifyRes.text();
            throw new Error(`Canvas token verification failed: ${errorText}`);
        }

        // Save to Firestore
        await userRef.set(
            {
                canvasToken: token,
                info: {
                    canvasBaseUrl: baseUrl,
                },
                lms: "canvas",
            },
            { merge: true },
        );
        return NextResponse.json({ message: "Canvas connected successfully" });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Internal Server Error" },
            { status: 500 },
        );
    }
}
