import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { ObtainAuthCredentials, FetchTimetableDay } from "@/lib/edumateClient";
import { saveTimetableConfig } from "@/lib/firebaseSchema";

import { getUid } from "@/lib/access/auth";
export async function POST(req: Request) {
    try {
        const userId = getUid(req);
        const userRef = db.collection("users").doc(userId);
        const doc = await userRef.get();
        if (!doc.exists) throw new Error("User not found");

        const { baseUrl, username, password } = await req.json();
        if (!baseUrl || !username || !password) {
            return NextResponse.json(
                { error: "Missing baseUrl, username or password" },
                { status: 400 },
            );
        }
        const authCredentials = await ObtainAuthCredentials(baseUrl, username, password);
        if (!authCredentials || authCredentials == "") {
            throw new Error(`Verification failed`);
        }
        const timetableData = await FetchTimetableDay(authCredentials, baseUrl, "today");
        if (timetableData && typeof timetableData === "object") {
            // Save to new collection structure
            await saveTimetableConfig(userId, {
                type: "edumate",
                baseUrl,
                username,
                password,
                currentCookies: authCredentials,
            });
            return NextResponse.json({ message: "Edumate connected successfully" });
        } else {
            return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
        }
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Internal Server Error" },
            { status: 500 },
        );
    }
}
