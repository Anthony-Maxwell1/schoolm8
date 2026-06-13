/**
 * lib/ai/study.ts
 *
 * Server-side generation of study material (flashcards, quizzes, summaries) from
 * the student's actual course content via Gemini. Flashcards/quizzes use
 * structured JSON (zod-validated); summaries return rich Markdown.
 */

import { z } from "zod";
import { randomUUID } from "crypto";
import { createGeminiClient } from "./client";
import { getLMSAssignments, getLMSCourses } from "@/lib/firebaseSchema";

const MAX_MATERIAL_CHARS = 8000;

export type StudySourceType = "assignment" | "course" | "topic";

interface StoredAssignment {
    id: string;
    title: string;
    description?: string;
    courseId: string;
    courseName: string;
    rubric?: Record<string, string[]>;
}

function stripFences(text: string): string {
    return text
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
}

function truncate(s: string, max: number): string {
    const clean = (s ?? "").replace(/\s+/g, " ").trim();
    return clean.length > max ? clean.slice(0, max) + "…" : clean;
}

/** Build a plain-text "material" blob plus a human label for the chosen source. */
export async function buildMaterial(
    uid: string,
    sourceType: StudySourceType,
    sourceId: string | undefined,
    topic: string | undefined,
): Promise<{ material: string; label: string }> {
    if (sourceType === "topic") {
        const t = (topic ?? "").trim();
        if (!t) throw new Error("Enter a topic to study.");
        return { material: `Topic: ${t}`, label: t };
    }

    if (sourceType === "assignment") {
        const map = await getLMSAssignments(uid);
        const a = (map ?? {})[sourceId ?? ""] as StoredAssignment | undefined;
        if (!a) throw new Error("Assignment not found. Sync Canvas and try again.");
        const rubric = a.rubric
            ? "\nRubric:\n" +
              Object.entries(a.rubric)
                  .map(([k, v]) => `- ${k}: ${v.join(" / ")}`)
                  .join("\n")
            : "";
        return {
            material: truncate(`Assignment: ${a.title}\nCourse: ${a.courseName}\n\n${a.description ?? ""}${rubric}`, MAX_MATERIAL_CHARS),
            label: a.title,
        };
    }

    // course
    const [coursesMap, assignmentsMap] = await Promise.all([
        getLMSCourses(uid),
        getLMSAssignments(uid),
    ]);
    const course = (coursesMap ?? {})[sourceId ?? ""] as { name: string } | undefined;
    if (!course) throw new Error("Course not found. Sync Canvas and try again.");
    const items = (Object.values(assignmentsMap ?? {}) as StoredAssignment[]).filter(
        (a) => a.courseId === sourceId,
    );
    const body = items
        .map((a) => `• ${a.title}: ${truncate(a.description ?? "", 400)}`)
        .join("\n");
    return {
        material: truncate(`Course: ${course.name}\n\nAssignments and topics covered:\n${body}`, MAX_MATERIAL_CHARS),
        label: course.name,
    };
}

// ── Flashcards ──────────────────────────────────────────────────────────────

export interface Flashcard {
    id: string;
    front: string;
    back: string;
}

const flashcardsSchema = z.object({
    cards: z
        .array(z.object({ front: z.string().min(1).max(400), back: z.string().min(1).max(1200) }))
        .min(1)
        .max(40),
});

export async function generateFlashcards(
    apiKey: string,
    model: string,
    material: string,
    count: number,
): Promise<Flashcard[]> {
    const ai = createGeminiClient(apiKey);
    const res = await ai.models.generateContent({
        model,
        contents: material,
        config: {
            temperature: 0.4,
            responseMimeType: "application/json",
            systemInstruction:
                `Create ${count} high-quality study flashcards from the material. Return STRICT JSON ` +
                `only: { "cards": [ { "front": string, "back": string } ] }. Fronts are concise ` +
                `questions or prompts; backs are clear, correct answers. Cover the key concepts, not ` +
                `trivia. No markdown fences.`,
        },
    });
    const parsed = flashcardsSchema.safeParse(JSON.parse(stripFences(res.text ?? "")));
    if (!parsed.success) throw new Error("Couldn't generate flashcards. Please try again.");
    return parsed.data.cards.map((c) => ({ id: randomUUID(), front: c.front, back: c.back }));
}

// ── Quiz ────────────────────────────────────────────────────────────────────

export interface QuizQuestion {
    id: string;
    type: "mcq" | "short";
    question: string;
    options?: string[];
    answer: string;
    explanation: string;
}

const quizSchema = z.object({
    questions: z
        .array(
            z.object({
                type: z.enum(["mcq", "short"]),
                question: z.string().min(1).max(600),
                options: z.array(z.string()).min(2).max(6).optional(),
                answer: z.string().min(1).max(600),
                explanation: z.string().min(1).max(800),
            }),
        )
        .min(1)
        .max(25),
});

export async function generateQuiz(
    apiKey: string,
    model: string,
    material: string,
    count: number,
): Promise<QuizQuestion[]> {
    const ai = createGeminiClient(apiKey);
    const res = await ai.models.generateContent({
        model,
        contents: material,
        config: {
            temperature: 0.4,
            responseMimeType: "application/json",
            systemInstruction:
                `Write a ${count}-question practice quiz from the material. Mix multiple-choice and ` +
                `short-answer. Return STRICT JSON only: { "questions": [ { "type": "mcq"|"short", ` +
                `"question": string, "options"?: string[] (mcq only, include the correct one), ` +
                `"answer": string (for mcq, the exact correct option text), "explanation": string } ] }. ` +
                `Explanations should teach why the answer is right. No markdown fences.`,
        },
    });
    const parsed = quizSchema.safeParse(JSON.parse(stripFences(res.text ?? "")));
    if (!parsed.success) throw new Error("Couldn't generate a quiz. Please try again.");
    return parsed.data.questions.map((q) => ({ id: randomUUID(), ...q }));
}

// ── Summary ─────────────────────────────────────────────────────────────────

export async function generateSummary(
    apiKey: string,
    model: string,
    material: string,
): Promise<string> {
    const ai = createGeminiClient(apiKey);
    const res = await ai.models.generateContent({
        model,
        contents: material,
        config: {
            temperature: 0.4,
            systemInstruction:
                "Write a clear, well-structured study summary / key-point sheet of the material in " +
                "Markdown. Use headings, short paragraphs, and bullet points for key terms and ideas. " +
                "Use LaTeX ($…$) for any maths. Be accurate and student-friendly.",
        },
    });
    return res.text ?? "";
}
