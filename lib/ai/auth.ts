/**
 * lib/ai/auth.ts
 *
 * Shared auth accessor for the AI/Calendar API routes. Token verification,
 * session cookies, OAuth-token scope checks, and Server Access Control all
 * happen once in `middleware.ts` before the request reaches this route.
 * This just reads back the uid middleware attached (or returns a 401 in the
 * — practically unreachable — case that it's missing).
 */

import { NextResponse } from "next/server";
import { getUidOrNull } from "@/lib/access/auth";

export type AuthOutcome = { uid: string } | { error: NextResponse };

export async function authenticate(req: Request): Promise<AuthOutcome> {
    const uid = getUidOrNull(req);
    if (!uid) {
        return {
            error: NextResponse.json(
                { error: "Missing or invalid Authorization header" },
                { status: 401 },
            ),
        };
    }
    return { uid };
}

export function isAuthError(outcome: AuthOutcome): outcome is { error: NextResponse } {
    return "error" in outcome;
}
