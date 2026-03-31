import { CanvasAssignment, CanvasCourse } from "@/app/api/canvas/sync/route";
import { ClassroomAssignment, ClassroomCourse } from "@/app/api/googleclassroom/sync/route";

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
};

export type Course = {
    id: string;
    name: string;
    description?: string;
    url?: string;
    source: "canvas" | "classroom" | "moodle";
};

export function normalizeCourse(course: CanvasCourse | ClassroomCourse): Course {
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

export function normalizeAssignment(
    assignment: CanvasAssignment | ClassroomAssignment,
): Assignment {
    if (assignment.hasOwnProperty("courseId")) {
        const a = assignment as CanvasAssignment;
        return {
            id: a.id.toString(),
            title: a.name,
            description: a.description,
            courseId: a.id.toString(),
            courseName: a.name,
            dueAt: a.due_at ? new Date(a.due_at) : undefined,
            url: a.html_url,
            source: "canvas",
        };
    } else {
        const a = assignment as ClassroomAssignment;
        return {
            id: a.id,
            title: a.title,
            description: a.description,
            courseId: a.courseId,
            courseName: a.courseName,
            dueAt: a.dueAt ? new Date(a.dueAt) : undefined,
            url: a.url,
            source: "classroom",
        };
    }
}
