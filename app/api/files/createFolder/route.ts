import { NextResponse } from "next/server";
import { db, auth } from "@/lib/firebaseAdmin";
import { assertAccess } from "@/lib/access/ServerAccessControl";

export default async function POST(req: Request) {
    try {
        const { itemId, parentId, newName } = await req.json();
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
        }

        const idToken = authHeader.split(" ")[1];
        const decoded = await auth.verifyIdToken(idToken);
        const uid = decoded.uid;
        const accessResult = await assertAccess(uid, ["api/files/*", "apiAccessLevel1"]);

        if (accessResult.status !== 200) {
            return new Response(JSON.stringify({ error: accessResult.body!.error }), {
                status: accessResult.status,
            });
        }

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
                parentReference: {
                    id: parentId,
                },
                name: newName,
            }),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
