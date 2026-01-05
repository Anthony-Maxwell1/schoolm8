// api/auth/onedrive/callback/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const code = url.searchParams.get("code");
        const stateStr = url.searchParams.get("state");

        if (!code || !stateStr) throw new Error("Missing code or state");

        const state = JSON.parse(stateStr);
        const { uid } = state;

        if (!uid) throw new Error("Missing UID in state");

        // Exchange code for token
        const tokenRes = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID!,
                scope: "Files.ReadWrite offline_access User.Read",
                code,
                redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/onedrive/callback`,
                grant_type: "authorization_code",
                client_secret: process.env.AZURE_CLIENT_SECRET!,
            }),
        });

        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) throw new Error("Failed to get access token");

        const userRef = db.collection("users").doc(uid);
        await userRef.set(
            { onedrive: { token: tokenData, updatedAt: new Date().toISOString() } },
            { merge: true },
        );

        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/settings`);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
