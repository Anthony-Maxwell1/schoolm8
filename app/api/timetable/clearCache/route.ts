import { db } from "@/lib/firebaseAdmin";
import { deleteTimetableCache } from "@/lib/firebaseSchema";
import { NextRequest, NextResponse } from "next/server";

import { getUid } from "@/lib/access/auth";
export async function POST(req: NextRequest) {
    const userId = getUid(req);
    await deleteTimetableCache(userId);
    return NextResponse.json({ message: "Timetable cache cleared" });
}
