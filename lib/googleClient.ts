import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URL!,
);

const scopes = {
    classroom: [
        "https://www.googleapis.com/auth/classroom.announcements.readonly",
        "https://www.googleapis.com/auth/classroom.courses.readonly",
        "https://www.googleapis.com/auth/classroom.coursework.me",
        "https://www.googleapis.com/auth/classroom.courseworkmaterials",
        "https://www.googleapis.com/auth/classroom.guardianlinks.me.readonly",
        "https://www.googleapis.com/auth/classroom.push-notifications",
        "https://www.googleapis.com/auth/classroom.rosters.readonly",
        "https://www.googleapis.com/auth/classroom.topics",
        "https://www.googleapis.com/auth/classroom.student-submissions.me.readonly",
    ],
};

export type ScopeCategory = keyof typeof scopes;

export function generateAuthUrl(category: ScopeCategory, state: string): string {
    return oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: scopes[category],
        prompt: "consent",
        state,
    });
}

export function getTokens(code: string) {
    return oauth2Client.getToken(code);
}
