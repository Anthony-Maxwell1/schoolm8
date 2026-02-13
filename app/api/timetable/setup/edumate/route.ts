import { NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import { ObtainAuthCredentials, FetchTimetableDay } from "@/lib/edumateClient";

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
            await userRef.set(
                {
                    timetable: {
                        type: "edumate",
                        baseUrl,
                        username,
                        password,
                        currentCookies: authCredentials,
                    },
                },
                { merge: true },
            );
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
