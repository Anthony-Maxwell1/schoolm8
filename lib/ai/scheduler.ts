/**
 * lib/ai/scheduler.ts
 *
 * Server-side: ask Gemini to turn a free-text workload description into a ranked,
 * estimated task list (structured JSON, zod-validated). Real Canvas due dates are
 * injected so the ranking reflects actual deadlines. The LLM ONLY ranks/estimates;
 * placement into the calendar is done deterministically in lib/ai/scheduling.ts.
 */

import { z } from "zod";
import { randomUUID } from "crypto";
import { createGeminiClient } from "./client";
import { getLMSAssignments } from "@/lib/firebaseSchema";
import type { PlannerTask } from "./scheduling";

const aiTaskSchema = z.object({
    title: z.string().trim().min(1).max(160),
    estimatedMinutes: z.number().int().min(5).max(600),
    priority: z.number().int().min(1).max(5),
    reasoning: z.string().trim().min(1).max(600),
    suggestedDueDate: z.string().trim().nullable().optional(),
    matchedAssignmentId: z.string().trim().nullable().optional(),
});

const planSchema = z.object({ tasks: z.array(aiTaskSchema).min(1).max(40) });

interface StoredAssignment {
    id: string;
    title: string;
    courseName: string;
    dueAt?: string | null;
    submission?: boolean;
    submissionState?: string;
    finishedOverride?: boolean;
}

function isDone(a: StoredAssignment): boolean {
    if (a.finishedOverride === true) return true;
    if (!a.submission) return false;
    return ["submitted", "graded", "complete", "pending_review"].includes(a.submissionState ?? "");
}

function stripJsonFences(text: string): string {
    return text
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
}

async function buildAssignmentContext(uid: string): Promise<string> {
    const map = await getLMSAssignments(uid);
    const now = Date.now();
    const relevant = (Object.values(map ?? {}) as StoredAssignment[])
        .filter((a) => !isDone(a))
        .map((a) => ({
            ...a,
            dueMs: a.dueAt ? new Date(a.dueAt).getTime() : Infinity,
        }))
        .sort((a, b) => a.dueMs - b.dueMs)
        .slice(0, 40);

    if (relevant.length === 0) {
        return "The student has no outstanding Canvas assignments on record.";
    }

    const lines = relevant.map((a) => {
        const due = a.dueAt ? new Date(a.dueAt).toISOString().slice(0, 16).replace("T", " ") : "no due date";
        const overdue = a.dueMs < now ? " (OVERDUE)" : "";
        return `- id=${a.id} | "${a.title}" | ${a.courseName} | due ${due}${overdue}`;
    });
    return `The student's outstanding Canvas assignments (use these real deadlines to weight priority and to set matchedAssignmentId/suggestedDueDate when a task clearly refers to one):\n${lines.join("\n")}`;
}

export interface RankResult {
    tasks: PlannerTask[];
}

export async function rankWorkload(
    uid: string,
    apiKey: string,
    model: string,
    workloadText: string,
): Promise<RankResult> {
    const assignmentContext = await buildAssignmentContext(uid);
    const todayISO = new Date().toISOString().slice(0, 10);

    const systemInstruction = [
        "You are a study planning assistant. The student will describe, in plain language, the work",
        "they need to do. Break it into concrete tasks and return STRICT JSON only — no prose, no",
        "markdown fences.",
        "",
        "JSON shape:",
        '{ "tasks": [ {',
        '  "title": string,                    // short, specific',
        '  "estimatedMinutes": integer 5-600,  // realistic focused-work estimate',
        '  "priority": integer 1-5,            // 5 = most urgent/important',
        '  "reasoning": string,                // one sentence: why this priority/order',
        '  "suggestedDueDate": string|null,    // ISO date (YYYY-MM-DD) the task should be done by',
        '  "matchedAssignmentId": string|null  // id from the list below if it maps to a real one',
        "} ] }",
        "",
        "Rules: weight priority by real due dates (sooner + overdue = higher). If a described item",
        "matches a listed Canvas assignment, set matchedAssignmentId and align suggestedDueDate to its",
        "deadline. Keep estimates realistic for a student. Order does not matter; priority does.",
        `Today is ${todayISO}.`,
        "",
        assignmentContext,
    ].join("\n");

    const ai = createGeminiClient(apiKey);
    const res = await ai.models.generateContent({
        model,
        contents: workloadText,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            temperature: 0.3,
        },
    });

    const raw = res.text ?? "";
    let parsed: unknown;
    try {
        parsed = JSON.parse(stripJsonFences(raw));
    } catch {
        throw new Error("The scheduler couldn't read the AI response. Please try again.");
    }

    const validated = planSchema.safeParse(parsed);
    if (!validated.success) {
        throw new Error("The AI returned an unexpected plan format. Please try again.");
    }

    const tasks: PlannerTask[] = validated.data.tasks.map((t) => ({
        id: randomUUID(),
        title: t.title,
        estimatedMinutes: t.estimatedMinutes,
        priority: t.priority,
        reasoning: t.reasoning,
        suggestedDueDate: t.suggestedDueDate ?? null,
        matchedAssignmentId: t.matchedAssignmentId ?? null,
    }));

    return { tasks };
}
