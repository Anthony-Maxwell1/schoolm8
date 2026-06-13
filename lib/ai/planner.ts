/**
 * lib/ai/planner.ts
 *
 * Persistence for accepted study-plan blocks at plannerBlocks/{uid}/items/{id}.
 */

import { db } from "@/lib/firebaseAdmin";
import type { PlacedBlock } from "./scheduling";

export interface SavedBlock extends PlacedBlock {
    reasoning?: string;
    suggestedDueDate?: string | null;
    matchedAssignmentId?: string | null;
    createdAt: string;
}

const itemsRef = (uid: string) => db.collection("plannerBlocks").doc(uid).collection("items");

export async function listBlocks(uid: string): Promise<SavedBlock[]> {
    const snap = await itemsRef(uid).orderBy("start", "asc").get();
    return snap.docs.map((d) => ({ ...(d.data() as SavedBlock), id: d.id }));
}

export async function saveBlocks(uid: string, blocks: SavedBlock[]): Promise<void> {
    const batch = db.batch();
    const ref = itemsRef(uid);
    const createdAt = new Date().toISOString();
    for (const b of blocks) {
        const { id, ...rest } = b;
        batch.set(ref.doc(id), { ...rest, id, createdAt: b.createdAt ?? createdAt });
    }
    await batch.commit();
}

export async function deleteBlock(uid: string, id: string): Promise<void> {
    await itemsRef(uid).doc(id).delete();
}

export async function clearBlocks(uid: string): Promise<void> {
    const snap = await itemsRef(uid).get();
    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
}
