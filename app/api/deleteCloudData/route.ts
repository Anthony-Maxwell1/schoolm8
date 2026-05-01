import { auth } from "@/lib/firebaseAdmin";
import { deleteData } from "@/lib/firebaseSchema";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
    }

    const idToken = authHeader.split(" ")[1];
    const decoded = await auth.verifyIdToken(idToken);
    const authedUserId = decoded.uid;

    await deleteData(authedUserId);
    return NextResponse.json({ message: "Cloud data deleted successfully" });
}
