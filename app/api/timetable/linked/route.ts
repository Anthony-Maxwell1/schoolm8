import { db } from "@/lib/firebaseAdmin";
import { getTimetableConfig } from "@/lib/firebaseSchema";
import { NextRequest, NextResponse } from "next/server";

import { getUid } from "@/lib/access/auth";
export async function GET(req: NextRequest) {
    try {
        console.log("[GET] Request started");

        // ---------- AUTH ----------
        const userId = getUid(req);
        console.log("[GET] User authenticated:", userId);

        // Get timetable config from new structure
        console.log("[GET] Fetching timetable config...");
        const timetableFetchData = await getTimetableConfig(userId);
        console.log("[GET] Got timetable config:", timetableFetchData);
        if (!timetableFetchData) {
            console.log("[GET] No timetable data found");
            return NextResponse.json({ timetable: null }, { status: 404 });
        }
        return NextResponse.json({ timetable: timetableFetchData.type }, { status: 200 });
    } catch (err: any) {
        console.error("[GET] Error occurred:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
