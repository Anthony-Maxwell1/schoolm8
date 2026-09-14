import { db } from "@/lib/firebaseAdmin";

import { getUid } from "@/lib/access/auth";
export async function POST(req: Request) {
    try {
        const userId = getUid(req);
        const userRef = db.collection("users").doc(userId);
        const doc = await userRef.get();
        if (!doc.exists) throw new Error("User not found");

        const { data } = await req.json();
        if (!data) {
            return new Response(JSON.stringify({ error: "Missing iCal file data" }), {
                status: 400,
            });
        }

        await userRef.set(
            {
                timetable: {
                    type: "ical-file",
                    data,
                },
            },
            { merge: true },
        );
        return new Response(JSON.stringify({ message: "iCal file uploaded successfully" }));
    } catch (err) {
        console.error(err);
        return new Response(
            JSON.stringify({ error: err instanceof Error ? err.message : "Internal Server Error" }),
            { status: 500 },
        );
    }
}
