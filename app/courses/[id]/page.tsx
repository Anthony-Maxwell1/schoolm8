"use client";

import { useAuth } from "@/context/authContext";
import {
    Course,
    Assignment,
    Announcement,
    normaliseCourse,
    normaliseAssignment,
    normaliseAnnouncement,
} from "@/lib/lmsNormaliser";
import { CanvasCourse, LMSAssignment, LMSAnnouncement } from "../../api/canvas/sync/route";
import {
    ClassroomCourse,
    ClassroomAssignment,
    ClassroomAnnouncement,
} from "../../api/googleclassroom/sync/route";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, FileText, Bell, AlertCircle } from "lucide-react";

export default function CourseDetailPage() {
    const { user, token, loading } = useAuth();
    const { id: courseId } = useParams();
    const [course, setCourse] = useState<Course | null>(null);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (loading || !user || !token || !courseId) return;

        setIsLoading(true);
        setError(null);

        Promise.all([
            fetch("/api/lms/courses", { headers: { Authorization: `Bearer ${token}` } })
                .then((res) => res.json())
                .then((data) => {
                    const coursesData = Object.values(data.courses) as (
                        | ClassroomCourse
                        | CanvasCourse
                    )[];
                    const foundCourse = coursesData.find((c) => c.id === courseId);
                    if (foundCourse) {
                        setCourse(normaliseCourse(foundCourse));
                    } else {
                        setError("Course not found");
                    }
                }),
            fetch("/api/lms/assignments", { headers: { Authorization: `Bearer ${token}` } })
                .then((res) => res.json())
                .then((data) => {
                    const assignmentsData = Object.values(data.assignments) as (
                        | LMSAssignment
                        | ClassroomAssignment
                    )[];
                    const courseAssignments = assignmentsData
                        .filter((a) => a.courseId === courseId)
                        .map((a) => normaliseAssignment(a));
                    setAssignments(courseAssignments);
                }),
            fetch("/api/lms/announcements", { headers: { Authorization: `Bearer ${token}` } })
                .then((res) => res.json())
                .then((data) => {
                    const announcementsData = Object.values(data.announcements) as (
                        | LMSAnnouncement
                        | ClassroomAnnouncement
                    )[];
                    const courseAnnouncements = announcementsData
                        .filter((an) => an.courseId === courseId)
                        .map((an) => normaliseAnnouncement(an));
                    setAnnouncements(courseAnnouncements);
                }),
        ])
            .catch((err) => {
                console.error("Failed to fetch course data:", err);
                setError("Failed to load course data");
            })
            .finally(() => setIsLoading(false));
    }, [user, token, loading, courseId]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-slate-600 border-t-emerald-500 rounded-full animate-spin" />
                    <p className="text-slate-400">Loading course...</p>
                </div>
            </div>
        );
    }

    if (error || !course) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-semibold text-white mb-2">Error</h2>
                    <p className="text-slate-400 mb-6">{error || "Course not found"}</p>
                    <Link
                        href="/courses"
                        className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Courses
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Header with Course Image */}
            <div className="relative h-64 bg-slate-800 overflow-hidden">
                {course.image && (
                    <img
                        src={course.image}
                        alt={course.name}
                        className="w-full h-full object-cover"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900" />

                {/* Back Button */}
                <div className="absolute top-6 left-6">
                    <Link
                        href="/courses"
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 backdrop-blur rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/80 transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Link>
                </div>

                {/* Course Title - Positioned at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h1 className="text-4xl font-bold text-white">{course.name}</h1>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-6 py-12">
                {/* Course Description */}
                {course.description && (
                    <section className="mb-12">
                        <h2 className="text-2xl font-semibold text-white mb-4">Overview</h2>
                        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                            <p className="text-slate-300 leading-relaxed">{course.description}</p>
                        </div>
                    </section>
                )}

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Announcements */}
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <Bell className="w-6 h-6 text-emerald-500" />
                                <h2 className="text-2xl font-semibold text-white">Announcements</h2>
                                {announcements.length > 0 && (
                                    <span className="ml-auto text-sm text-slate-400">
                                        {announcements.length} announcement
                                        {announcements.length !== 1 ? "s" : ""}
                                    </span>
                                )}
                            </div>

                            {announcements.length === 0 ? (
                                <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-8 text-center">
                                    <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-50" />
                                    <p className="text-slate-400">No announcements yet</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {announcements.map((announcement) => (
                                        <Link
                                            key={announcement.id}
                                            href={`/lms/announcement/${announcement.id}`}
                                            className="block bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-emerald-500/50 hover:bg-slate-800/70 transition-all group"
                                        >
                                            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                                                {announcement.title}
                                            </h3>
                                            {announcement.text && (
                                                <p className="text-slate-400 mb-3 line-clamp-2">
                                                    {announcement.text}
                                                </p>
                                            )}
                                            <div className="text-xs text-slate-500">
                                                {new Date(
                                                    announcement.createdAt,
                                                ).toLocaleDateString()}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Assignments */}
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <FileText className="w-6 h-6 text-emerald-500" />
                                <h2 className="text-2xl font-semibold text-white">Assignments</h2>
                                {assignments.length > 0 && (
                                    <span className="ml-auto text-sm text-slate-400">
                                        {assignments.length} assignment
                                        {assignments.length !== 1 ? "s" : ""}
                                    </span>
                                )}
                            </div>

                            {assignments.length === 0 ? (
                                <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-8 text-center">
                                    <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-50" />
                                    <p className="text-slate-400">No assignments yet</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {assignments.map((assignment) => (
                                        <Link
                                            key={assignment.id}
                                            href={`/lms/assignment/${assignment.id}`}
                                            className="block bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-emerald-500/50 hover:bg-slate-800/70 transition-all group"
                                        >
                                            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                                                {assignment.title}
                                            </h3>
                                            {assignment.description && (
                                                <p className="text-slate-400 mb-3 line-clamp-2">
                                                    {assignment.description}
                                                </p>
                                            )}
                                            <div className="flex items-center justify-between text-xs text-slate-500">
                                                <span>
                                                    {assignment.dueAt
                                                        ? `Due: ${new Date(assignment.dueAt).toLocaleDateString()}`
                                                        : "No due date"}
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Sidebar */}
                    <aside className="space-y-6">
                        {/* Course Info Card */}
                        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Course Info</h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-slate-400 text-xs uppercase tracking-wide">
                                        Course ID
                                    </p>
                                    <p className="text-white font-mono text-xs break-all">
                                        {course.id}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-emerald-500">
                                    {announcements.length}
                                </div>
                                <div className="text-xs text-slate-400 mt-1">Announcements</div>
                            </div>
                            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-emerald-500">
                                    {assignments.length}
                                </div>
                                <div className="text-xs text-slate-400 mt-1">Assignments</div>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}
