import { fail } from "assert";

export const userDataTemplate = {
    courses: [],
    assignments: [],
    files: [],
    projects: {},
    notes: {},
    tasks: {
        "lms-sync": {
            label: "LMS Sync",
            workinglabel: "Syncing LMS...",
            successlabel: "LMS Sync Complete",
            faillabel: "LMS Sync Failed",
            endpoint: "/api/lms/sync",
            method: "GET",
            wait: 3600, // 1 hour
            lastRun: new Date(),
            enabled: true,
        },
        "timetable-sync": {
            label: "Timetable Sync",
            workinglabel: "Timetable Syncing...",
            successlabel: "Timetable Sync Complete",
            faillabel: "Timetable Sync Failed",
            endpoint: "/api/timetable/fetch",
            method: "GET",
            wait: 3600, // 1 hour
            lastRun: new Date(),
            enabled: true,
        },
    },
};
