import { db } from "@/lib/firebaseAdmin";
import admin from "firebase-admin";
export async function GET(req: Request) {
    const url = new URL(req.url);
    const state = url.searchParams.get("state");

    if (!state) return new Response("State is required", { status: 400 });

    const userId = state.split(".")[0];
    if (!userId) return new Response("Invalid state", { status: 400 });

    try {
        await db
            .collection("users")
            .doc(userId)
            .set(
                {
                    google: {
                        classroom: admin.firestore.FieldValue.delete(),
                        calendar: admin.firestore.FieldValue.delete(),
                    },
                    lms: admin.firestore.FieldValue.delete(),
                },
                { merge: true },
            );
    } catch (err) {
        console.error("Error disconnecting Google:", err);
        return new Response("Failed to disconnect", { status: 500 });
    }

    return new Response("Successfully disconnected Google", { status: 200 });
}
