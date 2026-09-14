import { getUid } from "@/lib/access/auth";
import { addToClass, createClass, removeFromClass, updateInClass } from "@/lib/firebaseSchema";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const uid = getUid(req);
    const body = await req.json();
    const { classId, type, data } = body;
    try {
        await addToClass(uid, classId, type, data);
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const uid = getUid(req);
    const body = await req.json();
    const { classId, type, idx } = body;
    try {
        await removeFromClass(uid, classId, type, idx);
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const uid = getUid(req);
    const body = await req.json();
    const { classId, type, idx, data } = body;
    try {
        await updateInClass(uid, classId, type, idx, data);
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
