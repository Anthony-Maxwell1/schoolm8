import { NextResponse } from "next/server";
import { getUid } from "@/lib/access/auth";
import { enableDeveloper, isDeveloper } from "@/lib/oauth/developerStore";

export async function GET(req: Request) {
    return NextResponse.json({ enabled: await isDeveloper(getUid(req)) });
}

export async function POST(req: Request) {
    const uid = getUid(req);
    await enableDeveloper(uid);
    return NextResponse.json({ enabled: true });
}