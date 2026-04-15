import { NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import { saveTimetableConfig } from "@/lib/firebaseSchema";

export async function POST(req: Request) {
    try {
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

        const { url, username, password } = await req.json();
        if (!url || !username || !password) {
            return NextResponse.json(
                { error: "Missing url, username or password" },
                { status: 400 },
            );
        }
        const result = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Basic ${btoa(`${username}:${password}`)}`,
            },
        });
        if (!result.ok) {
            const error = await result.json();
            throw new Error(`Verification failed: ${error}`);
        }
        // Save to new collection structure
        await saveTimetableConfig(userId, {
            type: "ical",
            url,
            username,
            password,
        });
        return NextResponse.json({ message: "iCal connected successfully" });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Internal Server Error" },
            { status: 500 },
        );
    }
}
