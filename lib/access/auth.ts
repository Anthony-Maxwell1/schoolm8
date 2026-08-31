/**
 * lib/access/auth.ts
 *
 * Route handlers no longer verify tokens or run access control themselves.
 * `middleware.ts` does all of that up front, for EVERY request that reaches
 * an `app/api/**` route (with a small, explicit allowlist of exceptions for
 * things like third-party OAuth redirect callbacks that carry no bearer
 * credential at all -- see `PUBLIC_PATHS` in middleware.ts).
 *
 * By the time a route handler runs, the middleware has:
 *   1. Authenticated the caller (Firebase ID token, session cookie, or a
 *      schoolm8-issued third-party OAuth access token).
 *   2. Run Server Access Control (ban/allow lists) for the endpoint.
 *   3. For OAuth callers, checked that the token's granted scopes actually
 *      cover the endpoint being called.
 *   4. Stripped whatever `uid` query param the client may have sent (never
 *      trust a client-supplied uid) and replaced it with the verified one.
 *
 * `getUid()` just reads that verified value back out. If it's missing, the
 * route is either not covered by the middleware matcher or is being invoked
 * outside the normal request flow -- both are bugs, so this throws loudly
 * rather than silently returning an empty/undefined uid.
 */

export function getUid(req: Request): string {
    const uid = req.headers.get("x-schoolm8-uid");

    if (!uid) {
        throw new Error(
            "getUid(): no authenticated uid on this request."
        );
    }

    return uid;
}


/** Same as getUid, but returns null instead of throwing (for optional-auth endpoints). */
export function getUidOrNull(req: Request): string | null {
    const url = new URL(req.url);
    return url.searchParams.get("uid");
}

/**
 * When a request was authenticated via a third-party OAuth access token,
 * middleware also forwards the granted scopes and client id as headers so
 * route handlers can make finer-grained decisions if they need to (e.g.
 * refusing to return certain fields to third-party apps).
 */
export function getOAuthContext(req: Request): { clientId: string; scopes: string[] } | null {
    const clientId = req.headers.get("x-schoolm8-oauth-client");
    const scope = req.headers.get("x-schoolm8-oauth-scope");
    if (!clientId || scope === null) return null;
    return { clientId, scopes: scope.split(" ").filter(Boolean) };
}
