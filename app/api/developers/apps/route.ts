import { NextRequest, NextResponse } from "next/server";
import { getUid } from "@/lib/access/auth";
import { createDeveloperApp, isDeveloper, listDeveloperApps } from "@/lib/oauth/developerStore";

async function requireDeveloper(req: Request) {
    const uid = getUid(req);
    return (await isDeveloper(uid)) ? uid : null;
}

export async function GET(req: NextRequest) {
    const uid = await requireDeveloper(req);
    if (!uid) return NextResponse.json({ error: "Developer account required" }, { status: 403 });
    return NextResponse.json({ apps: await listDeveloperApps(uid) });
}

export async function POST(req: NextRequest) {
    const uid = await requireDeveloper(req);
    if (!uid) return NextResponse.json({ error: "Developer account required" }, { status: 403 });
    let body: { name?: string; logoUrl?: string };
    try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
    const name = body.name?.trim();
    if (!name) return NextResponse.json({ error: "App name is required" }, { status: 400 });
    return NextResponse.json({ app: await createDeveloperApp({ ownerUid: uid, name, logoUrl: body.logoUrl }) }, { status: 201 });
}