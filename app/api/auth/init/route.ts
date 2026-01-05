import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { userDataTemplate } from "@/lib/templates";

export async function POST(req: Request) {
    try {
        const { uid, name, email } = await req.json();

        if (!uid || !name || !email) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Create Firestore document with controlled fields
        await db
            .collection("users")
            .doc(uid)
            .set({
                canvasToken: null,
                info: {
                    name,
                    email,
                    verificationStatus: "unverified",
                    canvasBaseUrl: null,
                },
                data: userDataTemplate,
            });

        return NextResponse.json({ status: "ok" });
    } catch (err: any) {
        console.log(err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
