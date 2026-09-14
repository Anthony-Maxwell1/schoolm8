
import { deleteData } from "@/lib/firebaseSchema";
import { NextRequest, NextResponse } from "next/server";

import { getUid } from "@/lib/access/auth";
export async function DELETE(req: NextRequest) {
    const authedUserId = getUid(req);

    await deleteData(authedUserId);
    return NextResponse.json({ message: "Cloud data deleted successfully" });
}
