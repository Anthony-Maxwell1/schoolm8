import { NextResponse } from "next/server";
import { db, auth } from "@/lib/firebaseAdmin";
import { userDataTemplate } from "@/lib/templates";
import { assertAccess } from "@/lib/access/serverAccessControl";

export async function POST(req: Request) {
    try {
        // Authenticate request
        const authHeader = req.headers.get("Authorization");

        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json(
                { error: "Missing or invalid Authorization header" },
                { status: 401 },
            );
        }

        const idToken = authHeader.split(" ")[1];
        const decodedToken = await auth.verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const accessResult = await assertAccess(userId, ["api/auth/init/*", "apiAccessLevel0"]);

        if (accessResult.status !== 200) {
            return new Response(JSON.stringify({ error: accessResult.body!.error }), {
                status: accessResult.status,
            });
        }

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
