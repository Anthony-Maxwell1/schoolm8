import { NextResponse } from "next/server";
import { db, auth } from "@/lib/firebaseAdmin"; // admin is firebase-admin instance

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer "))
            return NextResponse.json(
                { error: "Missing or invalid Authorization header" },
                { status: 401 },
            );

        const idToken = authHeader.split(" ")[1];

        // Verify Firebase ID token
        const decodedToken = await auth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // Fetch user document
        const userRef = db.collection("users").doc(uid);
        const userDoc = await userRef.get();
        if (!userDoc.exists) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const assignments = userDoc.data()?.data?.assignments || {};

        return NextResponse.json({ status: "ok", assignments });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
