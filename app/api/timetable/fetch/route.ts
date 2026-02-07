import { NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import { parseICalData } from "@/lib/ical";

export async function GET(req: Request) {
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

        const timetableFetchData = doc.data()?.timetable;
        if (!timetableFetchData) {
            return NextResponse.json({ timetable: null });
        }

        if (timetableFetchData.type === "ical") {
            const { url, username, password } = timetableFetchData;
            const result = await fetch(url, {
                method: "GET",
                headers: {
                    'Authorization': `Basic ${btoa(`${username}:${password}`)}`
                }
            });
            if (!result.ok) {
                const error = await result.json();
                throw new Error(`Failed to fetch timetable: ${error}`);
            }
            const timetableData = await result.text(); // Assuming the iCal data is returned as text
            const parsedTimetable = parseICalData(timetableData);
            return NextResponse.json({ timetable: parsedTimetable });
        }
    } catch (err) {
        console.error(err);
        return new Response(
            JSON.stringify({ error: err instanceof Error ? err.message : "Internal Server Error" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
        );
    }
}