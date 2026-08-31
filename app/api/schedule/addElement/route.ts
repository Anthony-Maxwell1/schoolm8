// app/api/schedule/updateStatus/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { v4 as uuidv4 } from "uuid";
import { getUid } from "@/lib/access/auth";

export async function POST(req: Request) {
    try {
        const { scheduleId, element } = await req.json();
        console.log(element);
        console.log(scheduleId);
        if (!scheduleId || !element) throw new Error("Missing scheduleId or element");

        const userId = getUid(req);

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
