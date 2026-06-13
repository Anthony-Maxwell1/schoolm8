/**
 * lib/ai/decks.ts
 *
 * Flashcard deck persistence + spaced repetition (an SM-2 variant) at
 *   studyDecks/{uid}/decks/{deckId}
 * Cards are stored inline; each tracks its own ease/interval/dueAt.
 */

import { db } from "@/lib/firebaseAdmin";
import { randomUUID } from "crypto";

export type Grade = "again" | "hard" | "good" | "easy";

export interface ReviewCard {
    id: string;
    front: string;
    back: string;
    ease: number; // SM-2 ease factor
    intervalDays: number;
    reps: number;
    dueAt: string; // ISO
    lastReviewed?: string;
}

export interface Deck {
    id: string;
    title: string;
    sourceLabel: string;
    createdAt: string;
    updatedAt: string;
    cards: ReviewCard[];
}

export interface DeckSummary {
    id: string;
    title: string;
    sourceLabel: string;
    cardCount: number;
    dueCount: number;
    updatedAt: string;
}

const decksRef = (uid: string) => db.collection("studyDecks").doc(uid).collection("decks");

const MIN_EASE = 1.3;
const DAY_MS = 24 * 60 * 60 * 1000;

function initCard(front: string, back: string, now: number): ReviewCard {
    return {
        id: randomUUID(),
        front,
        back,
        ease: 2.5,
        intervalDays: 0,
        reps: 0,
        dueAt: new Date(now).toISOString(), // due immediately
    };
}

/** Apply a grade and return the next scheduling for a card. */
export function applyGrade(card: ReviewCard, grade: Grade, now: number): ReviewCard {
    let { ease, intervalDays, reps } = card;
    let nextDueMs: number;

    switch (grade) {
        case "again":
            ease = Math.max(MIN_EASE, ease - 0.2);
            reps = 0;
            intervalDays = 0;
            nextDueMs = now + 10 * 60 * 1000; // 10 minutes
            break;
        case "hard":
            ease = Math.max(MIN_EASE, ease - 0.15);
            intervalDays = Math.max(1, Math.round(Math.max(intervalDays, 1) * 1.2));
            reps += 1;
            nextDueMs = now + intervalDays * DAY_MS;
            break;
        case "good":
            intervalDays = reps === 0 ? 1 : reps === 1 ? 3 : Math.round(intervalDays * ease);
            reps += 1;
            nextDueMs = now + intervalDays * DAY_MS;
            break;
        case "easy":
            ease = ease + 0.15;
            intervalDays = reps === 0 ? 2 : Math.round(Math.max(intervalDays, 1) * ease * 1.3);
            reps += 1;
            nextDueMs = now + intervalDays * DAY_MS;
            break;
    }

    return {
        ...card,
        ease,
        intervalDays,
        reps,
        dueAt: new Date(nextDueMs).toISOString(),
        lastReviewed: new Date(now).toISOString(),
    };
}

export async function saveDeck(
    uid: string,
    title: string,
    sourceLabel: string,
    cards: { front: string; back: string }[],
): Promise<Deck> {
    const now = Date.now();
    const id = randomUUID();
    const deck: Deck = {
        id,
        title,
        sourceLabel,
        createdAt: new Date(now).toISOString(),
        updatedAt: new Date(now).toISOString(),
        cards: cards.map((c) => initCard(c.front, c.back, now)),
    };
    await decksRef(uid).doc(id).set(deck);
    return deck;
}

export async function listDecks(uid: string): Promise<DeckSummary[]> {
    const snap = await decksRef(uid).orderBy("updatedAt", "desc").get();
    const now = Date.now();
    return snap.docs.map((d) => {
        const deck = d.data() as Deck;
        const cards = deck.cards ?? [];
        return {
            id: d.id,
            title: deck.title,
            sourceLabel: deck.sourceLabel,
            cardCount: cards.length,
            dueCount: cards.filter((c) => new Date(c.dueAt).getTime() <= now).length,
            updatedAt: deck.updatedAt,
        };
    });
}

export async function getDeck(uid: string, id: string): Promise<Deck | null> {
    const doc = await decksRef(uid).doc(id).get();
    return doc.exists ? ({ ...(doc.data() as Deck), id: doc.id }) : null;
}

export async function deleteDeck(uid: string, id: string): Promise<void> {
    await decksRef(uid).doc(id).delete();
}

export interface DueCard {
    deckId: string;
    deckTitle: string;
    card: ReviewCard;
}

export async function listDueCards(uid: string, limit = 50): Promise<DueCard[]> {
    const snap = await decksRef(uid).get();
    const now = Date.now();
    const due: DueCard[] = [];
    snap.docs.forEach((d) => {
        const deck = d.data() as Deck;
        for (const card of deck.cards ?? []) {
            if (new Date(card.dueAt).getTime() <= now) {
                due.push({ deckId: d.id, deckTitle: deck.title, card });
            }
        }
    });
    due.sort((a, b) => new Date(a.card.dueAt).getTime() - new Date(b.card.dueAt).getTime());
    return due.slice(0, limit);
}

export async function gradeCard(
    uid: string,
    deckId: string,
    cardId: string,
    grade: Grade,
): Promise<ReviewCard | null> {
    const ref = decksRef(uid).doc(deckId);
    const doc = await ref.get();
    if (!doc.exists) return null;
    const deck = doc.data() as Deck;
    const now = Date.now();
    let updated: ReviewCard | null = null;
    const cards = (deck.cards ?? []).map((c) => {
        if (c.id === cardId) {
            updated = applyGrade(c, grade, now);
            return updated;
        }
        return c;
    });
    await ref.set({ cards, updatedAt: new Date(now).toISOString() }, { merge: true });
    return updated;
}
