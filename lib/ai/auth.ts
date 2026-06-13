/**
 * lib/ai/auth.ts
 *
 * Shared Firebase ID-token verification for the AI API routes. Mirrors the
 * pattern used across the existing Canvas/LMS routes but returns the uid (or a
 * ready-to-send error response) so each handler stays small.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/firebaseAdmin";

export type AuthOutcome = { uid: string } | { error: NextResponse };

export async function authenticate(req: Request): Promise<AuthOutcome> {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
        return {
            error: NextResponse.json(
                { error: "Missing or invalid Authorization header" },
                { status: 401 },
            ),
        };
    }

    try {
        const idToken = authHeader.split(" ")[1];
        const decoded = await auth.verifyIdToken(idToken);
        return { uid: decoded.uid };
    } catch {
        return {
            error: NextResponse.json({ error: "Invalid or expired session" }, { status: 401 }),
        };
    }
}

export function isAuthError(outcome: AuthOutcome): outcome is { error: NextResponse } {
    return "error" in outcome;
}
