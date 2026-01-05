// app/api/schedule/updateStatus/route.ts
import { NextResponse } from "next/server";
import { db, auth } from "@/lib/firebaseAdmin";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
    try {
        const { scheduleId, element } = await req.json();
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
        }
        console.log(element);
        console.log(scheduleId);
        const idToken = authHeader.split(" ")[1];
        if (!idToken) throw new Error("Missing authentication token");
        if (!scheduleId || !element) throw new Error("Missing scheduleId or element");

        const decoded = await auth.verifyIdToken(idToken);
        const userId = decoded.uid;

        const userRef = db.collection("users").doc(userId);
        const doc = await userRef.get();
        if (!doc.exists) throw new Error("User not found");

        const schedule = doc.get(`data.schedules.${scheduleId}`);
        if (!schedule) throw new Error("Schedule not found");

        element.id = element.id || uuidv4();

        await userRef.update({
            [`data.schedules.${scheduleId}.elements.${element.id}`]: element,
            [`data.schedules.${scheduleId}.updated`]: Date.now(),
        });

        return NextResponse.json({ status: "ok", scheduleId, elementId: element.id });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
