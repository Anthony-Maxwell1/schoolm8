import { assertAccess } from "@/lib/access/serverAccessControl";
import { auth, db } from "@/lib/firebaseAdmin";
import { getTimetableConfig } from "@/lib/firebaseSchema";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        console.log("[GET] Request started");

        // ---------- AUTH ----------
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            console.log("[GET] Missing Authorization header");
            return NextResponse.json(
                { error: "Missing or invalid Authorization header" },
                { status: 401 },
            );
        }

        const idToken = authHeader.split(" ")[1];
        const decodedToken = await auth.verifyIdToken(idToken);
        const userId = decodedToken.uid;
        const result = await assertAccess(userId, ["api/timetable/*", "apiAccessLevel0"]);

        if (result.status !== 200) {
            return new Response(JSON.stringify({ error: result.body!.error }), {
                status: result.status,
            });
        }
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
