import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { getLMSAnnouncements } from "@/lib/firebaseSchema";

import { getUid } from "@/lib/access/auth";
export async function GET(req: Request) {
    try {
        const uid = getUid(req);

        // Fetch announcements from new collection structure
        const announcements = await getLMSAnnouncements(uid);

        return NextResponse.json({ status: "ok", announcements });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
