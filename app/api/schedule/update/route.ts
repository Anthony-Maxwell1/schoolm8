// app/api/schedule/update/route.ts
import { NextResponse } from "next/server";
import { db, auth } from "@/lib/firebaseAdmin";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
    try {
        const { scheduleId, schedule } = await req.json();
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
        }

        const idToken = authHeader.split(" ")[1];
        if (!idToken) throw new Error("Missing authentication token");
        if (!scheduleId) throw new Error("Missing scheduleId");

        const decoded = await auth.verifyIdToken(idToken);
        const userId = decoded.uid;

        const userRef = db.collection("users").doc(userId);
        const doc = await userRef.get();
        if (!doc.exists) throw new Error("User not found");

        const existingSchedule = doc.get(`data.schedules.${scheduleId}`);
        if (!existingSchedule) throw new Error("Schedule not found");

        const updatedSchedule = {
            ...existingSchedule,
            ...schedule,
            updated: Date.now(),
            elements: (schedule.elements || []).map((el: any) => ({
                ...el,
                id: el.id || uuidv4(),
            })),
        };

        await userRef.update({
            [`data.schedules.${scheduleId}`]: updatedSchedule,
        });

        return NextResponse.json({ status: "ok", scheduleId });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
