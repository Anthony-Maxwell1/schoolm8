import { NextResponse } from "next/server";
import { db, auth } from "@/lib/firebaseAdmin";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const path = searchParams.get("path");
        if (!path) {
            return NextResponse.json({ error: "Missing path query parameter" }, { status: 400 });
        }
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            throw new Error("Missing Authorization header");
        }

        const idToken = authHeader.split(" ")[1];
        if (!idToken) throw new Error("Missing authentication token");

        const decoded = await auth.verifyIdToken(idToken);
        const userId = decoded.uid;

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
