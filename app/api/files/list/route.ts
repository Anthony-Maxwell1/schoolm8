import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { getUid } from "@/lib/access/auth";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const path = searchParams.get("path");
        if (!path) {
            return NextResponse.json({ error: "Missing path query parameter" }, { status: 400 });
        }

        const userId = getUid(req);

        const userRef = db.collection("users").doc(userId);
        const doc = await userRef.get();
        if (!doc.exists) throw new Error("User not found");
        const userData = doc.data();
        const access_token = userData?.onedrive?.access_token;
        if (!access_token) throw new Error("User not connected to OneDrive");
        if (!path) throw new Error("Missing path parameter");

        const response = await fetch(
            `https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURIComponent(path)}:/children`,
            {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            },
        );

        if (!response.ok) {
            throw new Error(`Error fetching files: ${response.statusText}`);
        }

        const files = await response.json();
        return NextResponse.json(files);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
