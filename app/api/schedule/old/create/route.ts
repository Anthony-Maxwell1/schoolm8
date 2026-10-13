// app/api/schedule/create/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { v4 as uuidv4 } from "uuid";
import { getUid } from "@/lib/access/auth";

export async function POST(req: Request) {
    try {
        const { name, elements } = await req.json();
        const userId = getUid(req);

        const scheduleId = uuidv4();
        const newSchedule = {
            id: scheduleId,
            created: Date.now(),
            updated: Date.now(),
            name,
            elements: (elements || []).map((el: any) => ({
                ...el,
                id: el.id || uuidv4(), // ensure each element has an ID
            })),
        };

        const userRef = db.collection("users").doc(userId);
        await userRef.update({
            [`data.schedules.${scheduleId}`]: newSchedule,
        });

        return NextResponse.json({ status: "ok", scheduleId });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
