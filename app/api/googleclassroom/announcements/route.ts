import { NextResponse } from "next/server";
import { db, auth } from "@/lib/firebaseAdmin";
import { getLMSAnnouncements } from "@/lib/firebaseSchema";

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer "))
            return NextResponse.json(
                { error: "Missing or invalid Authorization header" },
                { status: 401 },
            );

        const idToken = authHeader.split(" ")[1];

        // Verify Firebase ID token
        const decodedToken = await auth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // Fetch announcements from new collection structure
        const announcements = await getLMSAnnouncements(uid);

        return NextResponse.json({ status: "ok", announcements });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
