/**
 * app/api/ai/scheduler/plan/route.ts
 *
 * POST → turn a free-text workload into a ranked task list (Gemini) and place it
 * into free time around the student's busy intervals (deterministic algorithm).
 * Returns { tasks, blocks, unplaced } — nothing is saved until the user accepts.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticate, isAuthError } from "@/lib/ai/auth";
import { getDecryptedGeminiKey, getSelectedModel, updateKeyStatus } from "@/lib/ai/geminiKey";
import { resolveModel } from "@/lib/ai/models";
import { classifyGeminiError } from "@/lib/ai/client";
import { rankWorkload } from "@/lib/ai/scheduler";
import { buildSchedule, DEFAULT_SCHEDULE_OPTIONS, type BusyInterval } from "@/lib/ai/scheduling";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
    text: z.string().trim().min(1).max(4000),
    busy: z
        .array(
            z.object({
                start: z.string(),
                end: z.string(),
                title: z.string().optional(),
            }),
        )
        .max(500)
        .optional(),
    maxMinutesPerDay: z.number().int().min(30).max(720).optional(),
    horizonDays: z.number().int().min(1).max(21).optional(),
    tzOffsetMinutes: z.number().int().min(-840).max(840).optional(),
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

    const apiKey = await getDecryptedGeminiKey(uid);
    if (!apiKey) {
        return NextResponse.json(
            { error: "no_key", message: "Connect your Gemini key in Settings → AI to use the scheduler." },
            { status: 409 },
        );
    }

    const model = resolveModel(await getSelectedModel(uid));

    try {
        const { tasks } = await rankWorkload(uid, apiKey, model, parsed.data.text);
        await updateKeyStatus(uid, "valid").catch(() => {});

        const busy: BusyInterval[] = parsed.data.busy ?? [];
        const tzOffsetMinutes = parsed.data.tzOffsetMinutes ?? 0;
        // Anchor the plan to the user's *local* date, not the server's UTC date.
        const localDate = new Date(Date.now() - tzOffsetMinutes * 60000).toISOString().slice(0, 10);
        const { blocks, unplaced } = buildSchedule(tasks, busy, {
            ...DEFAULT_SCHEDULE_OPTIONS,
            startDate: localDate,
            maxMinutesPerDay: parsed.data.maxMinutesPerDay ?? DEFAULT_SCHEDULE_OPTIONS.maxMinutesPerDay,
            horizonDays: parsed.data.horizonDays ?? DEFAULT_SCHEDULE_OPTIONS.horizonDays,
            tzOffsetMinutes,
        });

        return NextResponse.json({ tasks, blocks, unplaced });
    } catch (err) {
        const classified = classifyGeminiError(err);
        if (classified.state === "invalid" || classified.state === "quota") {
            await updateKeyStatus(uid, classified.state).catch(() => {});
            return NextResponse.json({ error: classified.message, state: classified.state }, { status: 502 });
        }
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Failed to build plan" },
            { status: 500 },
        );
    }
}
