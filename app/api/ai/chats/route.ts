import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getUid } from "@/lib/access/auth";
import { schema } from "@/lib/firebaseSchema";
import { chatId as validateChatId, decodeChat, persistChat } from "@/lib/ai/chat-backend";

export async function GET(req: Request) {
    try {
        const userId = getUid(req);
        const chatId = new URL(req.url).searchParams.get("id");
        if (chatId) {
            const chat = await schema.ai.getChat(userId, validateChatId(chatId));
            return chat
                ? NextResponse.json({ chat: decodeChat(chat) })
                : NextResponse.json({ error: "Chat not found" }, { status: 404 });
        }
        return NextResponse.json({ chats: (await schema.ai.getChats(userId)).map(decodeChat) });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to load chats" },
            { status: 500 },
        );
    }
}

export async function POST(req: Request) {
    try {
        const userId = getUid(req);
        const body = await req.json();
        const id = validateChatId(body.id || uuidv4());
        if (!Array.isArray(body.messages)) return NextResponse.json({ error: "messages must be an array" }, { status: 400 });
        const existing = await schema.ai.getChat(userId, id);
        const title = existing?.title ? String(existing.title) : "New chat";
        await persistChat(userId, id, title, body.messages);
        return NextResponse.json({ id });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to save chat" },
            { status: 400 },
        );
    }
}

export async function DELETE(req: Request) {
    try {
        const userId = getUid(req);
        const id = new URL(req.url).searchParams.get("id");
        if (!id) return NextResponse.json({ error: "Missing chat id" }, { status: 400 });
        await schema.ai.deleteChat(userId, validateChatId(id));
        return NextResponse.json({ deleted: true });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to delete chat" },
            { status: 500 },
        );
    }
}

