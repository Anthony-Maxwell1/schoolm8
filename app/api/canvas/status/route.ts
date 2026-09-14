import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

import { getUid } from "@/lib/access/auth";
export async function GET(req: Request) {
    try {
        const userId = getUid(req);

        const userRef = db.collection("users").doc(userId);
        const doc = await userRef.get();
        if (!doc.exists) throw new Error("User not found");

        const userData = doc.data();
        const canvasToken = userData?.canvasToken;
        const canvasBaseUrl = userData?.info?.canvasBaseUrl;

        if (canvasToken && canvasBaseUrl) {
            // Verify Canvas token
            const verifyRes = await fetch(`${canvasBaseUrl}/api/v1/users/self`, {
                headers: {
                    Authorization: `Bearer ${canvasToken}`,
                },
            });

            if (verifyRes.ok) {
                return NextResponse.json({ connected: true });
            }
        }
        return NextResponse.json({ connected: false });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Internal Server Error" },
            { status: 500 },
        );
    }
}
