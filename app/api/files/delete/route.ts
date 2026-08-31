import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

import { getUid } from "@/lib/access/auth";
export async function DELETE(req: Request) {
    try {
        const { itemId } = await req.json();
        const uid = getUid(req);

        const userRef = db.collection("users").doc(uid);
        const doc = await userRef.get();
        const accessToken = doc.data()?.onedrive?.access_token;
        if (!accessToken) {
            throw new Error("User not connected to OneDrive");
        }

        const response = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${itemId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
