import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebaseAdmin";
import { assertAccess, getRequiredScopesForApiPath } from "@/lib/access/serverAccessControl";
import { pageAccessControl, normalizePageKey } from "@/lib/access/pageAccessControl";
import { looksLikeOAuthAccessToken, verifyOAuthAccessToken } from "@/lib/oauth/jwt";
import { SESSION_COOKIE_NAME } from "@/lib/access/sessionCookie";

const excludeRegex = /^\/(_next\/static|_next\/image|.*\..*)/;

const PUBLIC_PREFIXES = [
    "/auth",
    "/api/auth/session",
    "/api/auth/google/callback",
    "/api/auth/onedrive/callback",
    "/api/oauth/token",
    "/docs",
];

function isPublicPath(pathname: string): boolean {
    return PUBLIC_PREFIXES.some(
        (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
    );
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

export async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    if (excludeRegex.test(pathname)) {
        // Return a next response that tells Next.js to continue normal routing
        // without proxying (if called from a middleware context)
        return NextResponse.next();
    }

    if (isPublicPath(pathname)) {
        return NextResponse.next();
    }

    const isApi = pathname.startsWith("/api/");
    const credential = await resolveCredential(req);

    if (!credential) {
        if (isApi) {
            return jsonError(401, "Missing or invalid credentials");
        }
        const signInUrl = new URL("/auth", req.url);
        signInUrl.searchParams.set("next", pathname);
        return NextResponse.redirect(signInUrl);
    }

    const { uid, oauth } = credential;

    if (isApi) {
        if (oauth && pathname.startsWith("/api/developers")) {
            return jsonError(403, "Developer management is not available to third-party apps");
        }
        const requiredScopes = getRequiredScopesForApiPath(pathname);

        if (requiredScopes.length > 0) {
            const access = await assertAccess(uid, requiredScopes);
            if (access.status !== 200) {
                return NextResponse.json(access.body ?? { error: "Forbidden" }, {
                    status: access.status,
                });
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
