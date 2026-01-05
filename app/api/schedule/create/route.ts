// app/api/schedule/create/route.ts
import { NextResponse } from "next/server";
import { db, auth } from "@/lib/firebaseAdmin";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
    try {
        const { name, elements } = await req.json();
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
        }

        const idToken = authHeader.split(" ")[1];
        if (!idToken) throw new Error("Missing authentication token");

        const decoded = await auth.verifyIdToken(idToken);
        const userId = decoded.uid;

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
