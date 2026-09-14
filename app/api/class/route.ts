import { getUid } from "@/lib/access/auth";
import { createClass, deleteClass, getClass, updateClassDetails } from "@/lib/firebaseSchema";
import { NextURL } from "next/dist/server/web/next-url";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const uid = getUid(req);
    const body = await req.json();
    const { name } = body;
    try {
        await createClass(uid, name);
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const uid = getUid(req);
    const url = new NextURL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
        return NextResponse.json({ success: false, error: "Missing class ID" }, { status: 400 });
    }
    const class_ = await getClass(uid, id);
    if (!class_) {
        return NextResponse.json({ success: false, error: "Class not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, class: class_ }, { status: 200 });
}

export async function DELETE(req: Request) {
    const uid = getUid(req);
    const url = new NextURL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
        return NextResponse.json({ success: false, error: "Missing class ID" }, { status: 400 });
    }
    try {
        await deleteClass(uid, id);
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const uid = getUid(req);
    const url = new NextURL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
        return NextResponse.json({ success: false, error: "Missing class ID" }, { status: 400 });
    }
    const body = await req.json();
    const { name } = body;
    try {
        await updateClassDetails(uid, id, name);
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
