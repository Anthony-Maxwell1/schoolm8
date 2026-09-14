/**
 * app/api/auth/session/route.ts
 *
 * This is the one auth endpoint middleware.ts always lets through
 * unauthenticated (see PUBLIC_PREFIXES) -- it's how a session cookie gets
 * established in the first place.
 *
 *   POST body: { idToken }  -> verifies the ID token, sets an httpOnly
 *                              session cookie, so middleware.ts can
 *                              authenticate subsequent plain page loads.
 *   DELETE                  -> clears the cookie (called on sign-out).
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebaseAdmin";
import { SESSION_COOKIE_NAME } from "@/lib/access/sessionCookie";

const SESSION_EXPIRES_IN_MS = 14 * 24 * 60 * 60 * 1000; // 14 days -- Firebase's max

export async function POST(req: NextRequest) {
    let idToken: string | undefined;
    try {
        ({ idToken } = await req.json());
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!idToken) {
        return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    try {
        // checkRevoked=true so a signed-out/revoked token can't be used to mint a new cookie.
        await auth.verifyIdToken(idToken, true);
        const sessionCookie = await auth.createSessionCookie(idToken, {
            expiresIn: SESSION_EXPIRES_IN_MS,
        });

        const res = NextResponse.json({ status: "ok" });
        res.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            path: "/",
            maxAge: SESSION_EXPIRES_IN_MS / 1000,
        });
        return res;
    } catch (err) {
        console.error("Failed to create session cookie:", err);
        return NextResponse.json({ error: "Invalid or expired ID token" }, { status: 401 });
    }
}

export async function DELETE() {
    const res = NextResponse.json({ status: "ok" });
    res.cookies.set(SESSION_COOKIE_NAME, "", { path: "/", maxAge: 0 });
    return res;
}
