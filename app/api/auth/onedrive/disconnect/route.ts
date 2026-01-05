import { NextResponse } from "next/server";
import { db, auth } from "@/lib/firebaseAdmin";

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const tokenParam = url.searchParams.get("token");

        if (!tokenParam) {
            return NextResponse.json({ error: "Missing token" }, { status: 400 });
        }

        // Decode the token (assuming it's JSON encoded)
        let state: { uid: string; csrf?: string };
        try {
            state = JSON.parse(decodeURIComponent(tokenParam));
        } catch (err) {
            return NextResponse.json({ error: "Invalid token" }, { status: 400 });
        }

        const { uid } = state;
        if (!uid) {
            return NextResponse.json({ error: "Missing uid in token" }, { status: 400 });
        }

        // Fetch user
        const userRef = db.collection("users").doc(uid);
        const userSnap = await userRef.get();
        if (!userSnap.exists) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const userData = userSnap.data();
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
