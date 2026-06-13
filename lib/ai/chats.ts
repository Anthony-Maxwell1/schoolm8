/**
 * lib/ai/chats.ts
 *
 * Tutor chat history persistence. Conversations live at
 *   aiChats/{uid}/conversations/{conversationId}
 * with the message list stored inline on the document (bounded, single-read).
 */

import { db } from "@/lib/firebaseAdmin";
import { randomUUID } from "crypto";

export type ChatRole = "user" | "model";

export interface ChatMessage {
    role: ChatRole;
    content: string;
    createdAt: string;
    attachedAssignmentId?: string;
}

export interface Conversation {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    messages: ChatMessage[];
}

export interface ConversationSummary {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    messageCount: number;
}

const convsRef = (uid: string) =>
    db.collection("aiChats").doc(uid).collection("conversations");

export async function listConversations(uid: string): Promise<ConversationSummary[]> {
    const snap = await convsRef(uid).orderBy("updatedAt", "desc").limit(100).get();
    return snap.docs.map((d) => {
        const data = d.data() as Conversation;
        return {
            id: d.id,
            title: data.title ?? "Untitled chat",
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            messageCount: Array.isArray(data.messages) ? data.messages.length : 0,
        };
    });
}

export async function getConversation(
    uid: string,
    conversationId: string,
): Promise<Conversation | null> {
    const doc = await convsRef(uid).doc(conversationId).get();
    if (!doc.exists) return null;
    const data = doc.data() as Conversation;
    return { ...data, id: doc.id, messages: data.messages ?? [] };
}

/** Derive a short title from the first user message. */
export function deriveTitle(firstMessage: string): string {
    const clean = firstMessage.replace(/\s+/g, " ").trim();
    if (!clean) return "New chat";
    return clean.length > 60 ? clean.slice(0, 60).trimEnd() + "…" : clean;
}

export async function createConversation(uid: string, title: string): Promise<Conversation> {
    const now = new Date().toISOString();
    const id = randomUUID();
    const conversation: Conversation = {
        id,
        title: title || "New chat",
        createdAt: now,
        updatedAt: now,
        messages: [],
    };
    await convsRef(uid).doc(id).set(conversation);
    return conversation;
}

/** Overwrite the message list and bump updatedAt (used after each exchange). */
export async function saveMessages(
    uid: string,
    conversationId: string,
    messages: ChatMessage[],
): Promise<void> {
    await convsRef(uid)
        .doc(conversationId)
        .set({ messages, updatedAt: new Date().toISOString() }, { merge: true });
}

export async function deleteConversation(uid: string, conversationId: string): Promise<void> {
    await convsRef(uid).doc(conversationId).delete();
}
