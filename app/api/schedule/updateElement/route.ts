// app/api/schedule/updateStatus/route.ts
import { NextResponse } from "next/server";
import { db, auth } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
    try {
        const { scheduleId, elementId, updates } = await req.json();
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
        }

        const idToken = authHeader.split(" ")[1];
        if (!idToken) throw new Error("Missing authentication token");
        if (!scheduleId || !elementId) throw new Error("Missing scheduleId or elementId");

        const decoded = await auth.verifyIdToken(idToken);
        const userId = decoded.uid;

        const userRef = db.collection("users").doc(userId);
        const doc = await userRef.get();
        if (!doc.exists) throw new Error("User not found");

        const schedule = doc.get(`data.schedules.${scheduleId}`);
        if (!schedule) throw new Error("Schedule not found");

        const elementIndex = schedule.elements.findIndex((el: any) => el.id === elementId);
        if (elementIndex === -1) throw new Error("Element not found");

        // Update the element with new fields
        schedule.elements[elementIndex] = {
            ...schedule.elements[elementIndex],
            ...updates,
        };

        schedule.updated = Date.now();

        await userRef.update({
            [`data.schedules.${scheduleId}`]: schedule,
        });

        return NextResponse.json({ status: "ok", scheduleId, elementId });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
