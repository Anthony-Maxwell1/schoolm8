import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const state = url.searchParams.get("state");
        if (!state) {
            return new Response("State is required", { status: 400 });
        }
        const userId = state.split(".")[0];
        if (!userId) {
            return new Response("Invalid state", { status: 400 });
        }
        const userRef = db.collection("users").doc(userId);
        const doc = await userRef.get();
        if (!doc.exists) throw new Error("User not found");

        if (!doc.data()?.currentState || doc.data()?.currentState?.state !== state) {
            return new Response("Invalid state", { status: 400 });
        }

        const userData = doc.data();
        const accessToken = userData?.onedrive?.token.access_token;
        if (!accessToken) {
            return NextResponse.json(
                { error: "User is not connected to OneDrive" },
                { status: 400 },
            );
        }

        // Wipe OneDrive data
        await userRef.update({ onedrive: null });

        // Call Microsoft logout endpoint
        await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/logout", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Bearer ${accessToken}`,
            },
        });

        return NextResponse.json({ status: "ok", message: "OneDrive disconnected successfully" });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
