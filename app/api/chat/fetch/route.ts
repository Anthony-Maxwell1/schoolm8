import { NextResponse } from "next/server";


import { getUid } from "@/lib/access/auth";
export async function GET(req: Request) {
    const userId = getUid(req);

    return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
