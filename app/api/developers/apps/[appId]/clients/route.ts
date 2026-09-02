import { NextRequest, NextResponse } from "next/server";
import { getUid } from "@/lib/access/auth";
import { getDeveloperApp, isDeveloper } from "@/lib/oauth/developerStore";
import { listOAuthClients, registerOAuthClient } from "@/lib/oauth/store";
import { sanitizeRequestedScopes } from "@/lib/oauth/scopes";

async function ownApp(req: Request, appId: string) {
    const uid = getUid(req);
    return (await isDeveloper(uid)) && (await getDeveloperApp(appId, uid)) ? uid : null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ appId: string }> }) {
    const { appId } = await params;
    const uid = await ownApp(req, appId);
    if (!uid) return NextResponse.json({ error: "App not found" }, { status: 404 });
    const clients = await listOAuthClients(uid, appId);
    return NextResponse.json({ clients: clients.map(({ secretHash, publicKey, ...client }) => client) });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ appId: string }> }) {
    const { appId } = await params;
    const uid = await ownApp(req, appId);
    if (!uid) return NextResponse.json({ error: "App not found" }, { status: 404 });
    let body: { name?: string; redirectUris?: string[]; scopes?: string[]; authMethod?: "client_secret" | "private_key_jwt"; publicKey?: string };
    try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
    const name = body.name?.trim();
    if (!name || !Array.isArray(body.redirectUris) || body.redirectUris.length === 0) {
        return NextResponse.json({ error: "Name and at least one redirect URI are required" }, { status: 400 });
    }
    for (const uri of body.redirectUris) {
        try {
            const parsed = new URL(uri);
            if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") {
                return NextResponse.json({ error: `redirectUri must be https (got: ${uri})` }, { status: 400 });
            }
        } catch {
            return NextResponse.json({ error: `Invalid redirectUri: ${uri}` }, { status: 400 });
        }
    }
    const authMethod = body.authMethod ?? "client_secret";
    if (authMethod === "private_key_jwt" && !body.publicKey) {
        return NextResponse.json({ error: "publicKey is required for private_key_jwt" }, { status: 400 });
    }
    try {
        const result = authMethod === "private_key_jwt"
            ? await registerOAuthClient({ appId, name, redirectUris: body.redirectUris, scopes: sanitizeRequestedScopes(body.scopes ?? []), ownerUid: uid, authMethod, publicKey: body.publicKey! })
            : await registerOAuthClient({ appId, name, redirectUris: body.redirectUris, scopes: sanitizeRequestedScopes(body.scopes ?? []), ownerUid: uid, authMethod });
        return NextResponse.json({ ...result, authMethod }, { status: 201, headers: { "Cache-Control": "no-store" } });
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to create client" }, { status: 400 });
    }
}