/**
 * lib/googleCalendar.ts
 *
 * Server-side Google Calendar access using the per-user OAuth tokens stored at
 * users/{uid}.google.calendar.token (see app/api/auth/google/callback). Lets the
 * app read existing events as "busy" time for the scheduler and write study
 * sessions back to the user's primary calendar.
 */

import { google, calendar_v3 } from "googleapis";
import admin from "firebase-admin";
import { db } from "@/lib/firebaseAdmin";

export interface CalendarBusy {
    start: string; // ISO
    end: string; // ISO
    title?: string;
}

export interface CalendarEventInput {
    summary: string;
    description?: string;
    start: string; // ISO
    end: string; // ISO
    /** IANA tz for recurring events, e.g. "Australia/Sydney". */
    timeZone?: string;
    /** RRULE strings, e.g. ["RRULE:FREQ=WEEKLY;COUNT=4"]. */
    recurrence?: string[];
}

const userRef = (uid: string) => db.collection("users").doc(uid);

async function getStoredToken(uid: string): Promise<any | null> {
    const snap = await userRef(uid).get();
    return snap.exists ? (snap.data()?.google?.calendar?.token ?? null) : null;
}

export async function getCalendarStatus(uid: string): Promise<{ connected: boolean }> {
    const token = await getStoredToken(uid);
    return { connected: Boolean(token?.access_token && token?.refresh_token) };
}

/** Build an authorised Calendar client, persisting any refreshed tokens. */
async function getCalendarClient(uid: string): Promise<calendar_v3.Calendar> {
    const token = await getStoredToken(uid);
    if (!token?.access_token || !token?.refresh_token) {
        throw new Error("not_connected");
    }

    const oauth2 = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URL,
    );
    oauth2.setCredentials({
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        expiry_date: token.expiry_date,
        token_type: token.token_type,
        scope: token.scope,
    });

    // Persist refreshed access tokens so we don't re-auth every hour. Firestore
    // deep-merges, so the existing refresh_token is preserved.
    oauth2.on("tokens", (t) => {
        userRef(uid)
            .set({ google: { calendar: { token: t } } }, { merge: true })
            .catch(() => {});
    });

    return google.calendar({ version: "v3", auth: oauth2 });
}

/** List the user's timed events between two instants as busy intervals. */
export async function listBusyEvents(
    uid: string,
    timeMinISO: string,
    timeMaxISO: string,
): Promise<{ busy: CalendarBusy[]; events: CalendarBusy[] }> {
    const cal = await getCalendarClient(uid);
    const res = await cal.events.list({
        calendarId: "primary",
        timeMin: timeMinISO,
        timeMax: timeMaxISO,
        singleEvents: true,
        orderBy: "startTime",
        maxResults: 250,
    });

    const items = res.data.items ?? [];
    const events: CalendarBusy[] = [];
    const busy: CalendarBusy[] = [];

    for (const e of items) {
        if (e.status === "cancelled") continue;
        const start = e.start?.dateTime;
        const end = e.end?.dateTime;
        if (!start || !end) continue; // skip all-day events
        const declined = e.attendees?.some((a) => a.self && a.responseStatus === "declined");
        const ev: CalendarBusy = { start, end, title: e.summary ?? "Busy" };
        events.push(ev);
        // Free/transparent or declined events don't block study time.
        if (e.transparency === "transparent" || declined) continue;
        busy.push(ev);
    }

    return { busy, events };
}

/** Create one or more events on the primary calendar. Returns created ids/links. */
export async function createCalendarEvents(
    uid: string,
    events: CalendarEventInput[],
): Promise<{ created: number; links: string[] }> {
    const cal = await getCalendarClient(uid);
    const links: string[] = [];

    for (const ev of events) {
        const res = await cal.events.insert({
            calendarId: "primary",
            requestBody: {
                summary: ev.summary,
                description: ev.description,
                start: { dateTime: ev.start, timeZone: ev.timeZone },
                end: { dateTime: ev.end, timeZone: ev.timeZone },
                recurrence: ev.recurrence,
                source: { title: "SchoolMate", url: "https://schoolm8" },
            },
        });
        if (res.data.htmlLink) links.push(res.data.htmlLink);
    }

    return { created: links.length, links };
}

export async function disconnectCalendar(uid: string): Promise<void> {
    await userRef(uid).set(
        { google: { calendar: admin.firestore.FieldValue.delete() } },
        { merge: true },
    );
}

export const calendarClient = {
    listBusyEvents,
    createCalendarEvents,
    disconnectCalendar,
};
