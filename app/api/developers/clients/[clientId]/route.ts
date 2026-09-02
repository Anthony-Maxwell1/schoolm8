import { NextRequest, NextResponse } from "next/server";
import { getUid } from "@/lib/access/auth";
import { deleteOAuthClient, getOAuthClient, rotateOAuthClientSecret } from "@/lib/oauth/store";
import { isDeveloper } from "@/lib/oauth/developerStore";

async function ownClient(req: Request, clientId: string) {
    const uid = getUid(req);
    const client = await getOAuthClient(clientId);
    return (await isDeveloper(uid)) && client?.ownerUid === uid ? uid : null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
    const { clientId } = await params; const uid = await ownClient(req, clientId);
    if (!uid) return NextResponse.json({ error: "Client not found" }, { status: 404 });
    const client = await getOAuthClient(clientId);
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
    const { secretHash, publicKey, ...safeClient } = client;
    return NextResponse.json({ client: safeClient });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
    const { clientId } = await params; const uid = await ownClient(req, clientId);
    if (!uid) return NextResponse.json({ error: "Client not found" }, { status: 404 });
    const result = await rotateOAuthClientSecret(clientId, uid);
    if (!result) return NextResponse.json({ error: "Only client_secret credentials can be rerolled" }, { status: 400 });
    return NextResponse.json({ clientId, clientSecret: result.clientSecret, warning: "This secret is shown only once." }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
    const { clientId } = await params; const uid = await ownClient(req, clientId);
    if (!uid) return NextResponse.json({ error: "Client not found" }, { status: 404 });
    await deleteOAuthClient(clientId, uid);
    return NextResponse.json({ status: "ok" });
}