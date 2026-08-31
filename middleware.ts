/**
 * middleware.ts
 *
 * The single place authentication and access control happen for the whole
 * app. Route handlers and pages no longer verify tokens or run
 * ban/allow-list checks themselves -- see lib/access/auth.ts.
 *
 * For every request that isn't explicitly public:
 *   1. Resolve a credential, in priority order:
 *        - `Authorization: Bearer <token>` where <token> is a schoolm8-issued
 *          third-party OAuth access token (HS256, our own issuer) -> OAuth flow.
 *        - `Authorization: Bearer <token>` where <token> is a Firebase ID
 *          token (from the first-party web/app client) -> normal flow.
 *        - `sm8_session` cookie (a Firebase session cookie, set by
 *          /api/auth/session) -> used for plain page navigations, which
 *          can't attach an Authorization header.
 *   2. If no credential resolves to a uid: 401 for APIs, redirect to
 *      /auth/signin for pages.
 *   3. Server Access Control (the "UAC" ban/allow table) for API routes,
 *      derived automatically from the path via getRequiredScopesForApiPath.
 *      For OAuth-authenticated calls, additionally require the token to
 *      have been granted the specific scope the endpoint needs.
 *   4. Page Access Control (the separate "PageAC" ban/allow table) for
 *      everything else.
 *   5. On success: pages pass through completely unmodified. API requests
 *      get rewritten with any client-supplied `uid` query param stripped
 *      and replaced with the verified one, plus (for OAuth calls) headers
 *      identifying the calling client/scopes for route handlers that want
 *      them (see getOAuthContext in lib/access/auth.ts).
 *
 * IMPORTANT: this file relies on Firestore (via firebase-admin) and Node's
 * `crypto` module, neither of which run on the default Edge runtime, so it
 * must run on the Node.js middleware runtime (`export const config.runtime
 * = "nodejs"` below), which requires Next.js 15.2+.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebaseAdmin";
import { assertAccess, getRequiredScopesForApiPath } from "@/lib/access/serverAccessControl";
import { pageAccessControl, normalizePageKey } from "@/lib/access/pageAccessControl";
import { looksLikeOAuthAccessToken, verifyOAuthAccessToken } from "@/lib/oauth/jwt";
import { SESSION_COOKIE_NAME } from "@/lib/access/sessionCookie";

// Paths reachable with NO schoolm8 credential at all -- either because
// they're how you get a credential in the first place, or because they
// authenticate some other way entirely (a third-party OAuth server's
// `state` param, or client_id/secret in a token-exchange body).
const PUBLIC_PREFIXES = [
    "/auth", // sign-in / sign-up
    "/api/auth/session", // exchanges an ID token for a session cookie
    "/api/auth/google/callback", // Google's OAuth redirect -- authenticates via `state`
    "/api/auth/onedrive/callback", // Microsoft's OAuth redirect -- authenticates via `state`
    "/api/oauth/token", // third-party token exchange -- authenticates via client_id/secret
    "/docs", // public documentation site
];

function isPublicPath(pathname: string): boolean {
    return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));
}

type Credential = { uid: string; oauth: { clientId: string; scopes: string[] } | null };

async function resolveCredential(req: NextRequest): Promise<Credential | null> {
    const authHeader = req.headers.get("authorization");
    const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;

    try {
        if (bearer && looksLikeOAuthAccessToken(bearer)) {
            const claims = verifyOAuthAccessToken(bearer);
            return {
                uid: claims.sub,
                oauth: { clientId: claims.cid, scopes: claims.scope.split(" ").filter(Boolean) },
            };
        }

        if (bearer) {
            const decoded = await auth.verifyIdToken(bearer);
            return { uid: decoded.uid, oauth: null };
        }

        const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
        if (sessionCookie) {
            const decoded = await auth.verifySessionCookie(sessionCookie, true);
            return { uid: decoded.uid, oauth: null };
        }
    } catch {
        return null;
    }

    return null;
}

function jsonError(status: number, error: string) {
    return NextResponse.json({ error }, { status });
}

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    if (isPublicPath(pathname)) {
        return NextResponse.next();
    }

    const isApi = pathname.startsWith("/api/");
    const credential = await resolveCredential(req);

    if (!credential) {
        if (isApi) {
            return jsonError(401, "Missing or invalid credentials");
        }
        const signInUrl = new URL("/auth/signin", req.url);
        signInUrl.searchParams.set("next", pathname);
        return NextResponse.redirect(signInUrl);
    }

    const { uid, oauth } = credential;

    if (isApi) {
        const requiredScopes = getRequiredScopesForApiPath(pathname);

        if (requiredScopes.length > 0) {
            const access = await assertAccess(uid, requiredScopes);
            if (access.status !== 200) {
                return NextResponse.json(access.body ?? { error: "Forbidden" }, { status: access.status });
            }
        }

        if (oauth) {
            // Third-party apps may only reach endpoints that have a defined,
            // grantable scope, AND only if that exact scope was granted.
            const leafScope = requiredScopes[0];
            if (!leafScope) {
                return jsonError(403, "This endpoint is not available to third-party apps");
            }
            if (!oauth.scopes.includes(leafScope)) {
                return jsonError(403, `Token is missing required scope: ${leafScope}`);
            }
        }

        const url = req.nextUrl.clone();

        const headers = new Headers(req.headers);
        headers.delete("x-schoolm8-uid");
        headers.set("x-schoolm8-uid", uid);
        headers.delete("x-schoolm8-oauth-client");
        headers.delete("x-schoolm8-oauth-scope");
        if (oauth) {
            headers.set("x-schoolm8-oauth-client", oauth.clientId);
            headers.set("x-schoolm8-oauth-scope", oauth.scopes.join(" "));
        }

        return NextResponse.rewrite(url, { request: { headers } });
    }

    // Third-party OAuth access tokens are API-only; they don't get to load pages.
    if (oauth) {
        return jsonError(403, "This credential cannot be used to load pages");
    }

    const pageKey = normalizePageKey(pathname);
    const pageAccess = await pageAccessControl(uid, pageKey);
    if (pageAccess.status !== 200) {
        const deniedUrl = new URL("/auth", req.url);
        deniedUrl.searchParams.set("error", "forbidden");
        return NextResponse.redirect(deniedUrl);
    }

    return NextResponse.next();
}

export const config = {
    runtime: "nodejs",
    matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
