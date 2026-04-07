export const userDataTemplate = {
    courses: [],
    assignments: [],
    files: [],
    projects: {},
    notes: {},
    tasks: {
        "lms-sync": {
            label: "LMS Sync",
            endpoint: "/api/lms/sync",
            method: "GET",
            wait: 3600, // 1 hour
            lastRun: new Date(),
            enabled: true,
        },
        "timetable-sync": {
            label: "Timetable Sync",
            endpoint: "/api/timetable/fetch",
            method: "GET",
            wait: 3600, // 1 hour
            lastRun: new Date(),
            enabled: true,
        },
    },
};
