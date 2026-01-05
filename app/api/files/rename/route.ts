import { NextResponse } from "next/server";
import { db, auth } from "@/lib/firebaseAdmin";

export default async function POST(req: Request) {
    try {
        const { itemId, newName } = await req.json();
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
        }

        const idToken = authHeader.split(" ")[1];
        const decoded = await auth.verifyIdToken(idToken);
        const uid = decoded.uid;
        const userRef = db.collection("users").doc(uid);
        const doc = await userRef.get();
        const accessToken = doc.data()?.onedrive?.access_token;
        if (!accessToken) {
            throw new Error("User not connected to OneDrive");
        }

        const response = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${itemId}`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: newName,
            }),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
