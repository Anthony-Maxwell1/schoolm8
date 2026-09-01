import { checkAccessList } from "@/lib/access/serverAccessControl";

/** Normalizes a Next.js pathname ("/dashboard/editor") to a page key ("dashboard/editor"). */
export function normalizePageKey(pathname: string): string {
    return pathname.replace(/^\/+/, "").replace(/\/+$/, "") || "home";
}

export const pageAccessControl = async (uid: string, page: string) => {
    return checkAccessList("PageAC", uid, page);
};
