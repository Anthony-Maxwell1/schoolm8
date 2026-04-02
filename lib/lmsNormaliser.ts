import { LMSAssignment, LMSAnnouncement, CanvasCourse } from "@/app/api/canvas/sync/route";
import {
    ClassroomAssignment,
    ClassroomCourse,
    ClassroomAnnouncement,
} from "@/app/api/googleclassroom/sync/route";

export type Assignment = {
    id: string;
    title: string;
    description: string;
    courseId: string;
    courseName: string;
    dueAt?: Date;
    created?: Date;
    url?: string;
    source: "canvas" | "classroom" | "moodle";
    submission: boolean;
    submissionState: string;
    projects: any[];
    missing: boolean;
    rawCanvasData?: any;
    rawClassroomData?: any;
    rubric?: Record<string, string[]>; // Assuming rubric is a nested object
    image?: string;
};

export type Course = {
    id: string;
    name: string;
    description?: string;
    url?: string;
    source: "canvas" | "classroom" | "moodle";
    image?: string;
};

export type Announcement = {
    id: string;
    title?: string;
    text: string;
    courseId: string;
    courseName: string;
    state: string;
    createdAt: Date;
    updatedAt: Date;
    url?: string;
    source: "canvas" | "classroom" | "moodle";
    image?: string;
};

export function normaliseCourse(course: CanvasCourse | ClassroomCourse): Course {
    if (course.hasOwnProperty("html_url")) {
        const c = course as CanvasCourse;
        return {
            id: c.id.toString(),
            name: c.name,
            url: c.html_url,
            source: "canvas",
        };
    } else {
        const c = course as ClassroomCourse;
        return {
            id: c.id,
            name: c.name,
            url: c.url,
            source: "classroom",
        };
    }
}

export function normaliseAssignment(assignment: LMSAssignment | ClassroomAssignment): Assignment {
    if (assignment.hasOwnProperty("courseId")) {
        const a = assignment as LMSAssignment;
        return {
            ...a,
            dueAt: a.dueAt ? new Date(a.dueAt) : undefined,
            source: "canvas",
        };
    } else {
        const a = assignment as ClassroomAssignment;
        return {
            ...a,
            submission: a.submittedAt !== null,
            dueAt: a.dueAt ? new Date(a.dueAt) : undefined,
            source: "classroom",
        };
    }
}

export function normaliseAnnouncement(
    announcement: LMSAnnouncement | ClassroomAnnouncement,
): Announcement {
    if (announcement.hasOwnProperty("url")) {
        const a = announcement as LMSAnnouncement;
        return {
            ...a,
            text: a.message,
            state: "posted",
            createdAt: new Date(a.postedAt),
            updatedAt: new Date(a.updatedAt),
            source: "canvas",
        };
    } else {
        const a = announcement as ClassroomAnnouncement;
        return {
            ...a,
            createdAt: new Date(a.createdAt),
            updatedAt: new Date(a.updatedAt),
            source: "classroom",
        };
    }
}
