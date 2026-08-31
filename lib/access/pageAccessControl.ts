/**
 * lib/access/pageAccessControl.ts
 *
 * Same ban/allow-list semantics as `serverAccessControl.ts`, but for whole
 * *pages* (anything that isn't under /api/*) rather than API scopes, and
 * sourced from a separate Firestore table -- "PageAC" instead of "UAC" --
 * so that banning/allow-listing a page (e.g. "admin", "dashboard/editor")
 * is entirely independent from gating the API endpoints it happens to call.
 *
 * This is enforced centrally in `middleware.ts` for every page request. The
 * client-side `useAccessControl` hook reads from the same table purely for
 * instant UI feedback (skeleton/redirect before the page even renders); it
 * is NOT the source of truth and must never be treated as one, since a
 * client can trivially skip it.
 */

import { checkAccessList } from "@/lib/access/serverAccessControl";

/** Normalizes a Next.js pathname ("/dashboard/editor") to a page key ("dashboard/editor"). */
export function normalizePageKey(pathname: string): string {
    return pathname.replace(/^\/+/, "").replace(/\/+$/, "") || "home";
}

export const pageAccessControl = async (uid: string, page: string) => {
    return checkAccessList("PageAC", uid, page);
};
