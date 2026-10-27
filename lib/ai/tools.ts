import { parseICalData } from "@/lib/ical";
import { FetchTimetableDay, ObtainAuthCredentials } from "@/lib/edumateClient";
import {
    getLMSAnnouncements,
    getLMSAssignments,
    getLMSCourses,
    getTimetableConfig,
    getTimetableDay,
    saveTimetableConfig,
    saveTimetableDay,
    schema,
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
    if (authToken) {
        // prefer api route
        const res = await fetch(`/api/lms/courses`, {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        });
        if (!res.ok) {
            return {
                success: false,
                message: `Failed to fetch LMS classes: ${res.statusText}`,
                classes: null,
                status: res.status,
            };
        }
        const data = await res.json();
        return {
            success: true,
            message: "LMS classes fetched successfully",
            classes: data.courses,
            status: 200,
        };
    } else {
        try {
            const courses = await getLMSCourses(userId);
            return {
                success: true,
                message: "LMS classes fetched successfully",
                classes: courses,
                status: 200,
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : "Failed to fetch LMS classes",
                classes: null,
                status: 500,
            };
        }
    }
}

async function fetchLMSClass(userId: string, classId: string, authToken?: string) {
    if (authToken) {
        // prefer api route
        const resAssignments = await fetch(`/api/lms/assignments`, {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        });
        const resAnnouncements = await fetch(`/api/lms/announcements`, {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        });
        if (!resAssignments.ok || !resAnnouncements.ok) {
            return {
                success: false,
                message: `Failed to fetch LMS class: Assignments Res Status: ${resAssignments.statusText} / Announcements Res Status: ${resAnnouncements.statusText}`,
                class: null,
                status: resAssignments.status,
            };
        }
        const assignmentsData = await resAssignments.json();
        const announcementsData = await resAnnouncements.json();
        const filteredAssignments = assignmentsData.assignments.filter(
            (assignment: any) => assignment.courseId === classId,
        );
        const filteredAnnouncements = announcementsData.announcements.filter(
            (announcement: any) => announcement.courseId === classId,
        );
        return {
            success: true,
            message: "LMS class fetched successfully",
            class: {
                assignments: filteredAssignments,
                announcements: filteredAnnouncements,
            },
            status: 200,
        };
    } else {
        const assignments = await getLMSAssignments(userId);
        const announcements = await getLMSAnnouncements(userId);
        const filteredAssignments = assignments.filter(
            (assignment: any) => assignment.courseId === classId,
        );
        const filteredAnnouncements = announcements.filter(
            (announcement: any) => announcement.courseId === classId,
        );
        return {
            success: true,
            message: "LMS class fetched successfully",
            class: {
                assignments: filteredAssignments,
                announcements: filteredAnnouncements,
            },
            status: 200,
        };
    }
}

async function fetchLMSAnnouncements(userId: string, authToken?: string) {
    if (authToken) {
        // prefer api route
        const res = await fetch(`/api/lms/announcements`, {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        });
        if (!res.ok) {
            return {
                success: false,
                message: `Failed to fetch LMS announcements: ${res.statusText}`,
                announcements: [],
                status: res.status,
            };
        }
        const data = await res.json();
        return {
            success: true,
            message: "LMS announcements fetched successfully",
            announcements: data.announcements,
            status: 200,
        };
    } else {
        const announcements = await getLMSAnnouncements(userId);
        return {
            success: true,
            message: "LMS announcements fetched successfully",
            announcements,
            status: 200,
        };
    }
}

async function fetchLMSAssignments(userId: string, authToken?: string) {
    if (authToken) {
        // prefer api route
        const res = await fetch(`/api/lms/assignments`, {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        });
        if (!res.ok) {
            return {
                success: false,
                message: `Failed to fetch LMS assignments: ${res.statusText}`,
                assignments: [],
                status: res.status,
            };
        }
        const data = await res.json();
        return {
            success: true,
            message: "LMS assignments fetched successfully",
            assignments: data.assignments,
            status: 200,
        };
    } else {
        const assignments = await getLMSAssignments(userId);
        return {
            success: true,
            message: "LMS assignments fetched successfully",
            assignments,
            status: 200,
        };
    }
}

async function createQuickNote(
    userId: string,
    title: string,
    content: string,
    projects?: string[],
    assignments?: string[],
    authToken?: string,
) {
    if (authToken) {
        // prefer the api route
        const res = await fetch(`/api/notes/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
                title,
                content,
                projects: projects || [],
                assignments: assignments || [],
            }),
        });
        if (!res.ok) {
            return {
                success: false,
                message: `Failed to create quick note: ${res.statusText}`,
                noteId: null,
                status: res.status,
            };
        }
        return {
            success: true,
            message: `Quick note created successfully`,
            noteId: (await res.json()).noteId,
            status: 200,
        };
    } else {
        const res = await schema.notes.create(
            userId,
            title,
            content,
            projects || [],
            assignments || [],
        );
        const noteId = res.noteId;
        if (!noteId || res.status != "ok") {
            return {
                success: false,
                message: `Failed to create quick note`,
                noteId: null,
                status: res.status,
            };
        }
        return {
            success: true,
            message: `Quick note created successfully`,
            noteId,
            status: 200,
        };
    }
}

async function updateQuickNote(
    userId: string,
    noteId: string,
    title?: string,
    content?: string,
    projects?: string[],
    assignments?: string[],
    authToken?: string,
) {
    if (authToken) {
        // prefer the api route
        const res = await fetch(`/api/notes/update`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
                noteId,
                title,
                content,
                projects: projects || undefined,
                assignments: assignments || undefined,
            }),
        });
        if (!res.ok) {
            return {
                success: false,
                message: `Failed to update quick note: ${res.statusText}`,
                status: res.status,
            };
        }
        return {
            success: true,
            message: `Quick note updated successfully`,
            status: 200,
        };
    } else {
        // fallback to the direct schema call
        const res = await schema.notes.update(
            userId,
            noteId,
            title,
            content,
            projects || undefined,
            assignments || undefined,
        );
        if (res.status != "ok") {
            return {
                success: false,
                message: `Failed to update quick note: ${res.status}`,
                status: res.status,
            };
        }
        return {
            success: true,
            message: `Quick note updated successfully`,
            status: 200,
        };
    }
}

async function deleteQuickNote(userId: string, noteId: string, authToken?: string) {
    if (authToken) {
        // prefer the api route
        const res = await fetch(`/api/notes/delete`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
                noteId,
            }),
        });
        if (!res.ok) {
            return {
                success: false,
                message: `Failed to delete quick note: ${res.statusText}`,
                status: res.status,
            };
        }
        return {
            success: true,
            message: `Quick note deleted successfully`,
            status: 200,
        };
    } else {
        const res = await schema.notes.delete(userId, noteId);
        if (res.status != "ok") {
            return {
                success: false,
                message: `Failed to delete quick note: ${res.status}`,
                status: res.status,
            };
        }
        return {
            success: true,
            message: `Quick note deleted successfully`,
            status: 200,
        };
    }
}

async function fetchQuickNotes(userId: string, authToken?: string) {
    if (authToken) {
        // prefer the api route
        const res = await fetch(`/api/notes`, {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        });
        if (!res.ok) {
            return {
                success: false,
                message: `Failed to fetch quick notes: ${res.statusText}`,
                notes: null,
                status: res.status,
            };
        }
        const data = await res.json();
        return {
            success: true,
            message: "Quick notes fetched successfully",
            notes: data.notes,
            status: 200,
        };
    } else {
        try {
            const notes = await schema.notes.fetchAll(userId);
            return {
                success: true,
                message: "Quick notes fetched successfully",
                notes,
                status: 200,
            };
        } catch (error: any) {
            return {
                success: false,
                message: `Failed to fetch quick notes: ${error.message}`,
                notes: null,
                status: 500,
            };
        }
    }
}

export const tools = (uid: string, authToken?: string) => {
    // uid for server, auth for client
    /*
    - Fetch task(s) from metadata (e.g. get project that contains assignment)  BLOCKED
    - Fetch Timetable (Fetch day or week at a time)                             DONE
    - Fetch classes                                                             BLOCKED
    - Fetch class                                                               BLOCKED
    - Fetch LMS classes                                                         DONE
    - Fetch LMS unlinked (not in class) classes                                 BLOCKED
    - Fetch LMS announcements                                                   DONE
    - Fetch LMS assignments                                                     DONE
    - Fetch LMS class                                                           DONE
    // - Fetch LMS class assignments                                            not doing
    // - Fetch LMS class assignment                                             not doing
    - Fetch LMS class assignment submissions                                    included in assignment
    - Fetch all tasks                                                           BLOCKED
    - Fetch class tasks                                                         BLOCKED
    - Fetch task                                                                BLOCKED
    - Create class                                                              BLOCKED
    - Update class                                                              BLOCKED
    - Delete class                                                              BLOCKED
    - Create task                                                               BLOCKED
    - Update task                                                               BLOCKED
    - Delete task                                                               BLOCKED
    - Fetch tasks                                                               BLOCKED
    - Create quick note                                                         DONE
    - Update quick note                                                         DONE
    - Delete quick note                                                         DONE
    - Fetch quick notes                                                         Done
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
            description: "Fetch LMS classes for the user.",
            inputSchema: z.object({}),
            execute: async () => await fetchLMSClasses(uid, authToken),
        }),
        fetchLMSAnnouncements: tool({
            description: "Fetch LMS announcements for the user.",
            inputSchema: z.object({}),
            execute: async () => await fetchLMSAnnouncements(uid, authToken),
        }),
        fetchLMSAssignments: tool({
            description: "Fetch LMS assignments for the user.",
            inputSchema: z.object({}),
            execute: async () => await fetchLMSAssignments(uid, authToken),
        }),
        fetchLMSClass: tool({
            description: "Fetch a specific LMS class announcements and assignments for the user.",
            inputSchema: z.object({
                classId: z.string().describe("The ID of the class to fetch."),
            }),
            execute: async ({ classId }) => await fetchLMSClass(uid, classId, authToken),
        }),
        createQuickNote: tool({
            description: "Create a quick note for the user.",
            inputSchema: z.object({
                title: z.string().describe("The title of the note."),
                content: z.string().describe("The content of the note."),
                projects: z
                    .array(z.string())
                    .optional()
                    .describe(
                        "An optional array of project IDs to associate with the note. (Details available in the projects skill)",
                    ), // todo: implement projects skill
                assignments: z
                    .array(z.string())
                    .optional()
                    .describe("An optional array of assignment IDs to associate with the note."),
            }),
            execute: async ({ title, content, projects, assignments }) =>
                await createQuickNote(uid, title, content, projects, assignments, authToken),
        }),
        updateQuickNote: tool({
            description: "Update a quick note for the user.",
            inputSchema: z.object({
                noteId: z.string().describe("The ID of the note to update."),
                title: z.string().optional().describe("The new title of the note."),
                content: z.string().optional().describe("The new content of the note."),
                projects: z
                    .array(z.string())
                    .optional()
                    .describe(
                        "An optional array of project IDs to associate with the note. (Overwrites existing associated projects list) (Details available in the projects skill)",
                    ),
                assignments: z
                    .array(z.string())
                    .optional()
                    .describe(
                        "An optional array of assignment IDs to associate with the note. (Overwrites existing associated assignments list)",
                    ),
            }),
            execute: async ({ noteId, title, content, projects, assignments }) =>
                await updateQuickNote(
                    uid,
                    noteId,
                    title,
                    content,
                    projects,
                    assignments,
                    authToken,
                ),
        }),
        deleteQuickNote: tool({
            description: "Delete a quick note for the user.",
            inputSchema: z.object({
                noteId: z.string().describe("The ID of the note to delete."),
            }),
            execute: async ({ noteId }) => await deleteQuickNote(uid, noteId, authToken),
        }),
        fetchQuickNotes: tool({
            description: "Fetch all quick notes for the user.",
            inputSchema: z.object({}),
            execute: async () => await fetchQuickNotes(uid, authToken),
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
    - Toast notification (Only available when running client side)          TODO
    */
};
