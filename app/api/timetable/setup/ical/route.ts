import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { saveTimetableConfig } from "@/lib/firebaseSchema";

import { getUid } from "@/lib/access/auth";
export async function POST(req: Request) {
    try {
        const userId = getUid(req);
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
