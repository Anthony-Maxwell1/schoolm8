import { ENDPOINT_TO_SCOPE } from "@/lib/access/serverAccessControl";

const NOT_GRANTABLE_TO_THIRD_PARTIES = new Set<string>([
    "api/user/*",
    "api/auth/google/*",
    "api/auth/onedrive/*",
    "api/auth/universalState/*",
]);

const SCOPE_DESCRIPTIONS: Record<string, string> = {
    "api/timetable/*": "View and manage your timetable",
    "api/tasks/*": "View and manage your tasks",
    "api/canvas/*": "View your Canvas courses, assignments, and announcements",
    "api/googleclassroom/*": "View your Google Classroom courses, assignments, and announcements",
    "api/lms/*": "View your courses, assignments, and announcements",
    "api/chat/*": "Read and send messages in your chats",
    "api/knowledge/*": "View and manage your knowledge base",
    "api/themes/*": "View and manage your themes",
    "api/files/*": "View and manage your files",
    "api/notes/*": "View and manage your notes",
    "api/projects/*": "View and manage your projects",
    "api/schedule/*": "View and manage your schedule",
    "api/search/*": "Search your schoolm8 content",
};

export type GrantableScope = {
    id: string;
    description: string;
};

export const GRANTABLE_SCOPES: GrantableScope[] = Object.keys(ENDPOINT_TO_SCOPE)
    .filter((key) => key.startsWith("api/") && key.endsWith("/*"))
    .filter((key) => !NOT_GRANTABLE_TO_THIRD_PARTIES.has(key))
    .map((id) => ({ id, description: SCOPE_DESCRIPTIONS[id] ?? id }));

const GRANTABLE_SCOPE_IDS = new Set(GRANTABLE_SCOPES.map((s) => s.id));

/** Filters an arbitrary requested-scope list down to ones that actually exist and are grantable. */
export function sanitizeRequestedScopes(requested: string[]): string[] {
    return Array.from(new Set(requested)).filter((s) => GRANTABLE_SCOPE_IDS.has(s));
}

export function describeScope(scope: string): string {
    return SCOPE_DESCRIPTIONS[scope] ?? scope;
}
