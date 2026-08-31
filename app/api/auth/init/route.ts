import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { userDataTemplate } from "@/lib/templates";

import { getUid } from "@/lib/access/auth";
export async function POST(req: Request) {
    try {
        // Authenticate request
        const userId = getUid(req);

        // Get client data
        const { name, email } = await req.json();

        if (!name || !email) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const userRef = db.collection("users").doc(userId);
        const existingDoc = await userRef.get();

        // Only create if it doesn't exist
        if (!existingDoc.exists) {
            await userRef.set({
                canvasToken: null,
                info: {
                    name,
                    email,
                    verificationStatus: "unverified",
                    canvasBaseUrl: null,
                },
                timetable: {},
                data: userDataTemplate,
                createdAt: new Date(),
            });
            return NextResponse.json({ status: "ok", created: true });
        }

        return NextResponse.json({ status: "ok", created: false });
    } catch (err: any) {
        console.log(err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
