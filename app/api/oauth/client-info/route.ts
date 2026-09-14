import { NextRequest, NextResponse } from "next/server";
import { getOAuthClient, isRedirectUriAllowed } from "@/lib/oauth/store";
import { sanitizeRequestedScopes, describeScope } from "@/lib/oauth/scopes";

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const clientId = searchParams.get("client_id");
    const redirectUri = searchParams.get("redirect_uri");
    const requestedScope = (searchParams.get("scope") ?? "").split(" ").filter(Boolean);

    if (!clientId || !redirectUri) {
        return NextResponse.json({ error: "Missing client_id or redirect_uri" }, { status: 400 });
    }

    const client = await getOAuthClient(clientId);
    if (!client) {
        return NextResponse.json({ error: "Unknown client_id" }, { status: 404 });
    }

    if (!isRedirectUriAllowed(client, redirectUri)) {
        return NextResponse.json({ error: "redirect_uri is not registered for this client" }, { status: 400 });
    }

    // Only offer scopes that both (a) exist/are grantable at all, and
    // (b) this client is actually registered to request.
    const scopes = sanitizeRequestedScopes(requestedScope).filter((s) => client.scopes.includes(s));

    return NextResponse.json({
        name: client.name,
        logoUrl: client.logoUrl ?? null,
        scopes: scopes.map((id) => ({ id, description: describeScope(id) })),
    });
}
