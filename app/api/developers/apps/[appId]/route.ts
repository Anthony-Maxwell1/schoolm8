import { NextRequest, NextResponse } from "next/server";
import { getUid } from "@/lib/access/auth";
import { deleteDeveloperApp, getDeveloperApp, isDeveloper, updateDeveloperApp } from "@/lib/oauth/developerStore";

async function ownApp(req: Request, appId: string) {
    const uid = getUid(req);
    return (await isDeveloper(uid)) && (await getDeveloperApp(appId, uid)) ? uid : null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ appId: string }> }) {
    const { appId } = await params; const uid = await ownApp(req, appId);
    if (!uid) return NextResponse.json({ error: "App not found" }, { status: 404 });
    return NextResponse.json({ app: await getDeveloperApp(appId, uid) });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ appId: string }> }) {
    const { appId } = await params; const uid = await ownApp(req, appId);
    if (!uid) return NextResponse.json({ error: "App not found" }, { status: 404 });
    const body = (await req.json()) as { name?: string; logoUrl?: string };
    const name = body.name?.trim();
    if (body.name !== undefined && !name) return NextResponse.json({ error: "App name is required" }, { status: 400 });
    return NextResponse.json({ app: await updateDeveloperApp(appId, uid, { name, logoUrl: body.logoUrl }) });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ appId: string }> }) {
    const { appId } = await params; const uid = await ownApp(req, appId);
    if (!uid) return NextResponse.json({ error: "App not found" }, { status: 404 });
    await deleteDeveloperApp(appId, uid);
    return NextResponse.json({ status: "ok" });
}