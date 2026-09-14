import { db } from "@/lib/firebaseAdmin";

import { getUid } from "@/lib/access/auth";
export async function GET(req: Request) {
    try {
        const userId = getUid(req);
        const userRef = db.collection("users").doc(userId);
        const doc = await userRef.get();
        if (!doc.exists) throw new Error("User not found");

        await userRef.set(
            {
                timetable: null,
            },
            { merge: true },
        );
        return new Response(
            JSON.stringify({ message: "iCal timetable disconnected successfully" }),
        );
    } catch (err) {
        console.error(err);
        return new Response(
            JSON.stringify({ error: err instanceof Error ? err.message : "Internal Server Error" }),
            { status: 500 },
        );
    }
}
