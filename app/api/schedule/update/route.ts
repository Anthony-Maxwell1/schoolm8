// app/api/schedule/update/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { v4 as uuidv4 } from "uuid";
import { getUid } from "@/lib/access/auth";

export async function POST(req: Request) {
    try {
        const { scheduleId, schedule } = await req.json();
        if (!scheduleId) throw new Error("Missing scheduleId");

        const userId = getUid(req);

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
