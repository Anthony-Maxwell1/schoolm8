import { auth, db } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer "))
            return new Response(
                JSON.stringify({ error: "Missing or invalid Authorization header" }),
                { status: 401 },
            );

        const idToken = authHeader.split(" ")[1];
        const decodedToken = await auth.verifyIdToken(idToken);
        const userId = decodedToken.uid;
        const userRef = db.collection("users").doc(userId);
        const doc = await userRef.get();
        if (!doc.exists) throw new Error("User not found");

        const { data } = await req.json();
        if (!data) {
            return new Response(JSON.stringify({ error: "Missing iCal file data" }), {
                status: 400,
            });
        }

        await userRef.set(
            {
                timetable: {
                    type: "ical-file",
                    data,
                },
            },
            { merge: true },
        );
        return new Response(JSON.stringify({ message: "iCal file uploaded successfully" }));
    } catch (err) {
        console.error(err);
        return new Response(
            JSON.stringify({ error: err instanceof Error ? err.message : "Internal Server Error" }),
            { status: 500 },
        );
    }
}
