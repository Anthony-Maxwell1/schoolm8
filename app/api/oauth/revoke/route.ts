import { NextRequest, NextResponse } from "next/server";
import { getUid } from "@/lib/access/auth";
import { revokeGrant, listGrantsForUser, getOAuthClient } from "@/lib/oauth/store";

/** Lists the third-party apps the current user has granted access to (for a settings page). */
export async function GET(req: NextRequest) {
    const uid = getUid(req);
    const grants = await listGrantsForUser(uid);

    const apps = await Promise.all(
        grants.map(async (g) => {
            const client = await getOAuthClient(g.clientId);
            return {
                clientId: g.clientId,
                name: client?.name ?? "Unknown app",
                scopes: g.scopes,
            };
        }),
    );

    return NextResponse.json({ apps });
}

export async function POST(req: NextRequest) {
    const uid = getUid(req);

    let body: { clientId?: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!body.clientId) {
        return NextResponse.json({ error: "Missing clientId" }, { status: 400 });
    }

    await revokeGrant(uid, body.clientId);
    return NextResponse.json({ status: "ok" });
}
