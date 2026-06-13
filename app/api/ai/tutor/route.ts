/**
 * app/api/ai/tutor/route.ts
 *
 * Streaming AI Tutor endpoint. Grounds Gemini in the student's synced Canvas
 * data, streams the reply back as plain text, and persists the conversation.
 * The new/active conversation id is returned in the `X-Conversation-Id` header.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticate, isAuthError } from "@/lib/ai/auth";
import { classifyGeminiError, createGeminiClient } from "@/lib/ai/client";
import { getDecryptedGeminiKey, getSelectedModel, updateKeyStatus } from "@/lib/ai/geminiKey";
import { resolveModel } from "@/lib/ai/models";
import { assembleTutorContext } from "@/lib/ai/context";
import {
    type ChatMessage,
    createConversation,
    deriveTitle,
    getConversation,
    saveMessages,
} from "@/lib/ai/chats";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
    message: z.string().trim().min(1).max(8000),
    conversationId: z.string().trim().min(1).max(128).optional(),
    attachedAssignmentId: z.string().trim().min(1).max(128).optional(),
    model: z.string().trim().optional(),
});

export async function POST(req: Request) {
    const authResult = await authenticate(req);
    if (isAuthError(authResult)) return authResult.error;
    const { uid } = authResult;

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.issues[0]?.message ?? "Invalid request" },
            { status: 400 },
        );
    }
    const { message, conversationId, attachedAssignmentId } = parsed.data;

    // Require a configured key — surface a friendly, actionable error otherwise.
    const apiKey = await getDecryptedGeminiKey(uid);
    if (!apiKey) {
        return NextResponse.json(
            {
                error: "no_key",
                message:
                    "Connect your Gemini key in Settings → AI to unlock the tutor.",
            },
            { status: 409 },
        );
    }

    const model = resolveModel(parsed.data.model ?? (await getSelectedModel(uid)));

    // Load or create the conversation, then assemble grounding context.
    const conversation =
        (conversationId ? await getConversation(uid, conversationId) : null) ??
        (await createConversation(uid, deriveTitle(message)));

    const { systemInstruction } = await assembleTutorContext(uid, attachedAssignmentId);

    // Build Gemini turn history from prior messages + the new user message.
    const history = conversation.messages.map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
    }));
    const contents = [...history, { role: "user", parts: [{ text: message }] }];

    const userMessage: ChatMessage = {
        role: "user",
        content: message,
        createdAt: new Date().toISOString(),
        ...(attachedAssignmentId ? { attachedAssignmentId } : {}),
    };

    const ai = createGeminiClient(apiKey);
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
            let assistantText = "";
            try {
                const result = await ai.models.generateContentStream({
                    model,
                    contents,
                    config: { systemInstruction, temperature: 0.7 },
                });

                for await (const chunk of result) {
                    const text = chunk.text;
                    if (text) {
                        assistantText += text;
                        controller.enqueue(encoder.encode(text));
                    }
                }

                // Persist the exchange and mark the key healthy.
                const finalMessages: ChatMessage[] = [
                    ...conversation.messages,
                    userMessage,
                    {
                        role: "model",
                        content: assistantText,
                        createdAt: new Date().toISOString(),
                    },
                ];
                await Promise.all([
                    saveMessages(uid, conversation.id, finalMessages),
                    updateKeyStatus(uid, "valid"),
                ]);
            } catch (err) {
                const classified = classifyGeminiError(err);
                if (classified.state === "invalid" || classified.state === "quota") {
                    await updateKeyStatus(uid, classified.state).catch(() => {});
                }
                // Surface the error inline so the user sees why it stopped.
                if (!assistantText) {
                    controller.enqueue(encoder.encode(`⚠️ ${classified.message}`));
                }
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            "X-Conversation-Id": conversation.id,
            "X-Conversation-Title": encodeURIComponent(conversation.title),
        },
    });
}
