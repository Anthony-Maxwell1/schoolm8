import { parseICalData } from "@/lib/ical";
import { FetchTimetableDay, ObtainAuthCredentials } from "@/lib/edumateClient";
import {
    getTimetableConfig,
    getTimetableDay,
    saveTimetableConfig,
    saveTimetableDay,
} from "@/lib/firebaseSchema";
import { standardiseDay, getWeekDates } from "@/lib/timetableNormaliser";
import { tool } from "ai";
import z from "zod";

const TIMETABLE_CACHE_DURATION_MS = 1000 * 60 * 60;

type TimetableToolResult = {
    success: boolean;
    message: string;
    timetable: unknown;
    cached?: boolean;
    status?: number;
};

function noTimetableData(status?: number): TimetableToolResult {
    return {
        success: false,
        message: "No timetable data",
        timetable: null,
        ...(status === undefined ? {} : { status }),
    };
}

async function fetchTimetableFromUid(
    userId: string,
    type: "day" | "week" = "day",
    value = "today",
): Promise<TimetableToolResult> {
    const config = await getTimetableConfig(userId);
    if (!config) return noTimetableData(404);

    const dates =
        type === "week"
            ? getWeekDates(value)
            : [value === "today" ? new Date().toISOString().split("T")[0] : value];
    const results: Record<string, unknown> = {};
    let allCached = true;

    if (config.type === "ical") {
        const response = await fetch(config.url, {
            headers: {
                Authorization: `Basic ${btoa(`${config.username}:${config.password}`)}`,
            },
        });
        if (!response.ok) throw new Error("Failed to fetch iCal timetable");

        const parsedEvents = parseICalData(await response.text());
        for (const date of dates) {
            const cached = await getTimetableDay(userId, date);
            if (cached) {
                results[date] = cached;
                continue;
            }

            allCached = false;
            const timetable = await standardiseDay({
                provider: "ical",
                parsedICalEvents: parsedEvents,
                date,
            });
            await saveTimetableDay(userId, date, timetable, TIMETABLE_CACHE_DURATION_MS);
            results[date] = timetable;
        }
    } else if (config.type === "edumate") {
        const { baseUrl, username, password } = config;
        if (!baseUrl || !username || !password) {
            return noTimetableData(400);
        }

        let cookies = config.currentCookies;
        if (!cookies) {
            cookies = await ObtainAuthCredentials(baseUrl, username, password);
            if (!cookies) throw new Error("Failed to authenticate with Edumate");
        }

        for (const date of dates) {
            const cached = await getTimetableDay(userId, date);
            if (cached) {
                results[date] = cached;
                continue;
            }

            allCached = false;
            const rawDay = await FetchTimetableDay(
                cookies,
                baseUrl,
                type === "day" && value === "today" ? "today" : date,
            );
            if (rawDay.error === 401) {
                cookies = await ObtainAuthCredentials(baseUrl, username, password);
                if (!cookies) throw new Error("Failed to authenticate with Edumate");
            }

            const timetable = await standardiseDay({
                provider: "edumate",
                rawDay,
                date,
            });
            await saveTimetableDay(userId, date, timetable, TIMETABLE_CACHE_DURATION_MS);
            results[date] = timetable;
        }

        await saveTimetableConfig(userId, { ...config, currentCookies: cookies });
    } else {
        return noTimetableData(404);
    }

    const timetable = type === "week" ? results : results[dates[0]];
    return {
        success: true,
        message: "Timetable data fetched successfully",
        timetable,
        cached: allCached,
        status: 200,
    };
}

async function fetchTimetable(
    userId: string,
    authToken?: string,
    type?: "day" | "week",
    value?: string,
) {
    if (!userId) return noTimetableData(401);
    try {
        return await fetchTimetableFromUid(userId, type, value);
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Failed to fetch timetable data",
            timetable: null,
            status: 500,
        } satisfies TimetableToolResult;
    }
}

async function fetchLMSClasses(userId: string, authToken?: string) {
    // TODO: Implement fetching LMS
    return {
        success: false,
        message: "Not Implemented",
        classes: null,
        status: 501,
    };
}

export const tools = (uid: string, authToken?: string) => {
    // uid for server, auth for client
    /*
    - Fetch Timetable (Fetch day or week at a time)                             DONE
    - Fetch classes                                                             BLOCKED
    - Fetch class                                                               BLOCKED
    - Fetch LMS classes                                                         IN PROGRESS
    - Fetch LMS unlinked (not in class) classes                                 BLOCKED
    - Fetch LMS class                                                           TODO
    - Fetch LMS class assignments                                               TODO
    - Fetch LMS class assignment                                                TODO
    - Fetch LMS class assignment submissions                                    TODO
    - Fetch class tasks                                                         BLOCKED
    - Fetch task                                                                BLOCKED
    - Create class                                                              BLOCKED
    - Update class                                                              BLOCKED
    - Delete class                                                              BLOCKED
    - Create task                                                               BLOCKED
    - Update task                                                               BLOCKED
    - Delete task                                                               BLOCKED
    - Fetch tasks                                                               BLOCKED
    - Create quick note                                                         TODO
    - Update quick note                                                         TODO
    - Delete quick note                                                         TODO
    - Fetch quick notes                                                         TODO
    - Fetch knowledge base tree                                                 TODO
    - Fetch knowledge base page                                                 TODO
    - Create knowledge base page                                                TODO
    - Update knowledge base page                                                TODO
    - Delete knowledge base page                                                TODO
    - Fetch schedule layers                                                     BLOCKED
    - Fetch schedule layer                                                      BLOCKED
    - Update schedule layer                                                     BLOCKED
    - Delete schedule layer                                                     BLOCKED
    - Create schedule layer                                                     BLOCKED
    - Push schedule to targets (e.g. google calendar)                           BLOCKED
    - Push schedule layer to targets (e.g. google calendar)                     BLOCKED
    - Fetch schedule layer from source (e.g. google calendar)                   BLOCKED
    - Link source/target to schedule layer (e.g. edumate, google calendar)      BLOCKED
    - Fetch theme settings (e.g. tilepack theme, website theme)                 TODO
    - Fetch detailed theme settings (e.g. css)                                  TODO
    - Update theme settings (e.g. tilepack theme, website theme)                TODO
    - Update detailed theme settings (e.g. css)                                 TODO
    - Fetch tilepack/dashboard/tile/website themes                              TODO
    - Update tilepack/dashboard/tile/website theme                              TODO
    - Create tilepack/dashboard/tile/website theme                              TODO
    - Delete tilepack/dashboard/tile/website theme                              TODO
    - Browse community themes                                                   TODO
    - Publish community theme                                                   TODO
    - Fetch community theme                                                     TODO
    - Install community theme                                                   TODO
    - Remove theme                                                              TODO
    - Reset themes to default                                                   TODO
    - Fetch dashboard pages & layout                                            TODO
    - Update dashboard pages & layout                                           TODO
    - Fetch agent profiles                                                      TODO
    - Fetch agent profile                                                       TODO
    - Update agent profile                                                      TODO
    - Create agent profile                                                      TODO
    - Delete agent profile                                                      TODO
    - Ask yes/no from user                                                      TODO
    - Ask user for input                                                        TODO
    - Ask user for permission, if yes perform another tool                      TODO
    - Set conversation name                                                     TODO
    - Fetch conversations history                                               TODO
    - Fetch conversation summary                                                TODO
    - Fetch user settings                                                       TODO
    - Fetch user integrations                                                   TODO
    - Prompt user to set up integration                                         TODO
    - Ask permission to change sensitive setting                                TODO
    - Change non-sensitive setting                                              TODO
    - Update user profile/details                                               TODO
    - Set up integration on user behalf                                         TODO
    - Fetch user profile                                                        TODO
    - Mark task as complete                                                     BLOCKED
    - Request user permission to submit assignment on their behalf              TODO
    - Create time-scheduled job                                                 BLOCKED
    - Create time-scheduled system agent                                        BLOCKED
    - Create event-scheduled job                                                BLOCKED
    - Create event-scheduled system agent                                       BLOCKED
    - Create system agent                                                       BLOCKED
    - Update system agent                                                       BLOCKED
    - Delete system agent                                                       BLOCKED
    - Fetch system agents                                                       BLOCKED
    - Fetch system agent                                                        BLOCKED
    - Fetch system agent logs                                                   BLOCKED
    - Request user permission to create time-scheduled job (e.g. submit assignment)                                 BLOCKED
    - Request user permission to create time-scheduled system agent (e.g. update schedule)                          BLOCKED
    - Request user permission to create event-scheduled job (e.g. submit assignment)                                BLOCKED
    - Request user permission to create event-scheduled system agent (e.g. update schedule)                         BLOCKED
    - Fetch file from source (e.g. LMS, Google Drive, OneDrive)                                                     TODO
    - Upload file to target (e.g. LMS, Google Drive, OneDrive)                                                      TODO
    - Request user permission to upload file to target (e.g. LMS, Google Drive, OneDrive)                           TODO
    - Update file on target (e.g. LMS, Google Drive, OneDrive)                                                      TODO
    - Request user permission to update file on target (e.g. LMS, Google Drive, OneDrive)                           TODO
    // - Delete file on target (e.g. LMS, Google Drive, OneDrive)           - sensitive action, not permitted without explicit user permission
    - Request user permission to delete file on target (e.g. LMS, Google Drive, OneDrive)                           TODO
    - Fetch file metadata from source (e.g. LMS, Google Drive, OneDrive)                                            TODO
    - Update file metadata on target (e.g. LMS, Google Drive, OneDrive)                                             TODO
*/
    return {
        fetchTimetable: tool({
            description: "Fetch timetable data for a specific day or week",
            inputSchema: z.object({
                type: z
                    .enum(["day", "week"])
                    .optional()
                    .default("day")
                    .describe(
                        "The amount of data to fetch. Either 'day' which fetches a specific day, or 'week' which fetches a week of data. Default 'day'.",
                    ),
                value: z
                    .string()
                    .optional()
                    .default("today")
                    .describe(
                        "The specific day or week to fetch. For 'day', this can be a date in YYYY-MM-DD format or 'today'. For 'week', this can be a date in YYYY-MM-DD format representing any day in the week to fetch. Default is 'today'.",
                    ),
            }),
            execute: async ({ type, value }) => await fetchTimetable(uid, authToken, type, value),
        }),
        fetchLMSClasses: tool({
            description: "Fetch LMS classes for the user",
            inputSchema: z.object({}),
            execute: async () => await fetchLMSClasses(uid, authToken),
        }),
    };
};

export const systemTools = {
    // Tools only available to system agents
    /*
    - Push notification                                                     BLOCKED
    - Push notification via 3rd party service (e.g. email, ntfy.sh, sms)    BLOCKED
    - Time-sensitive alert                                                  BLOCKED
    - Send network request to authorized endpoint                           TODO
    */
};
