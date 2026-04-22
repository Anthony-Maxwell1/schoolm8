"use client";
import { useCss } from "@/lib/css";
import { redirect } from "next/dist/client/components/navigation";
import { useRef, useState, useEffect } from "react";
import {
    Assignment,
    Announcement,
    Course,
    normaliseAnnouncement,
    normaliseAssignment,
    normaliseCourse,
} from "@/lib/lmsNormaliser";
import { useAuth } from "@/context/authContext";
import {
    ClassroomAnnouncement,
    ClassroomAssignment,
    ClassroomCourse,
} from "../api/googleclassroom/sync/route";
import { CanvasCourse, LMSAnnouncement, LMSAssignment } from "../api/canvas/sync/route";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function LMS() {
    const announcementRef = useRef<HTMLDivElement>(null);
    const assignmentRef = useRef<HTMLDivElement>(null);
    const { css, setCss } = useCss();
    const style = css.app.lms.page;
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const { user, token, loading } = useAuth();

    useEffect(() => {
        if (loading || !user || !token) return;
        // Fetch data from API and update state
        fetch("/api/lms/announcements", { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => res.json())
            .then((data) =>
                setAnnouncements(
                    (
                        Object.values(data.announcements) as (
                            | LMSAnnouncement
                            | ClassroomAnnouncement
                        )[]
                    ).map((a) => normaliseAnnouncement(a)),
                ),
            )
            .catch((err) => console.error(err));

        fetch("/api/lms/assignments", { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => res.json())
            .then((data) => {
                const assignments = Object.values(data.assignments) as (
                    | LMSAssignment
                    | ClassroomAssignment
                )[];

                setAssignments(assignments.map((a) => normaliseAssignment(a)));
            })
            .catch((err) => console.error(err));

        fetch("/api/lms/courses", { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => res.json())
            .then((data) => {
                const courses = Object.values(data.courses) as (ClassroomCourse | CanvasCourse)[];
                setCourses(courses.map((c) => normaliseCourse(c)));
            })
            .catch((err) => console.error(err));
    }, [user, token, loading]);

    const scroll = (ref: any, direction: "left" | "right") => {
        if (!ref.current) return;
        ref.current.scrollBy({
            left: direction === "left" ? -300 : 300,
            behavior: "smooth",
        });
    };

    const Section = ({
        title,
        data,
        redirectTemplate,
        refProp,
    }: {
        title: string;
        data: any[];
        redirectTemplate: string;
        refProp: any;
    }) => (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">{title}</h2>
                <button className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                    See all
                </button>
            </div>

            {/* Carousel */}
            <div className="relative group">
                {/* Left Button */}
                <button
                    onClick={() => scroll(refProp, "left")}
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 backdrop-blur p-2 rounded-lg text-white hover:bg-slate-800"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Scroll Area */}
                <div ref={refProp} className="flex gap-4 overflow-x-auto scroll-smooth pb-2 px-8">
                    {data.map((item, i) => (
                        <div
                            key={i}
                            className="shrink-0 w-80 h-48 rounded-lg bg-linear-to-br from-slate-700/40 to-slate-800/40 border border-slate-700/50 hover:border-emerald-500/50 backdrop-blur transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 ring-1 ring-white/10 p-4 cursor-pointer overflow-hidden group"
                            onClick={function () {
                                redirect(redirectTemplate.replace("{id}", item.id));
                            }}
                        >
                            {item.image && (
                                <img
                                    src={item.image}
                                    className="w-full h-32 object-cover rounded-lg mb-2 group-hover:scale-105 transition-transform"
                                />
                            )}
                            <div>
                                <h4 className="font-semibold text-white line-clamp-1 group-hover:text-emerald-400 transition-colors">
                                    {item.title}
                                </h4>
                                <p className="text-sm text-slate-400 line-clamp-1">
                                    {item.description &&
                                        item.description.slice(0, 50) +
                                            (item.description.length > 50 ? "..." : "")}
                                    {item.text &&
                                        item.text.slice(0, 50) +
                                            (item.text.length > 50 ? "..." : "")}
                                </p>
                                {item.due && (
                                    <p className="text-xs text-slate-500 mt-1">
                                        Due: {new Date(item.due).toLocaleDateString()}
                                    </p>
                                )}
                                {item.created && (
                                    <p className="text-xs text-slate-500">
                                        Posted: {new Date(item.created).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right Button */}
                <button
                    onClick={() => scroll(refProp, "right")}
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 backdrop-blur p-2 rounded-lg text-white hover:bg-slate-800"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
            {/* Announcements */}
            {announcements.length > 0 && (
                <Section
                    title="Announcements"
                    redirectTemplate="/lms/announcement/{id}?cameFrom=/lms"
                    data={announcements}
                    refProp={announcementRef}
                />
            )}

            {/* Assignments */}
            {assignments.length > 0 && (
                <Section
                    title="Assignments"
                    redirectTemplate="/lms/assignment/{id}?cameFrom=/lms"
                    data={assignments}
                    refProp={assignmentRef}
                />
            )}

            {/* Courses */}
            {courses.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">Your Courses</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map((course, i) => (
                            <div
                                key={i}
                                className="relative overflow-hidden rounded-2xl h-48 cursor-pointer group"
                                onClick={function () {
                                    redirect(`/lms/course/${course.id}?cameFrom=/lms`);
                                }}
                            >
                                {/* Image */}
                                <img
                                    src={course.image}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />

                                {/* Overlay */}
                                <div className="absolute inset-0 bg-linear-to-b from-transparent to-slate-900/80" />

                                {/* Text */}
                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                    <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors line-clamp-2">
                                        {course.name}
                                    </h3>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {announcements.length === 0 && assignments.length === 0 && courses.length === 0 && (
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <h2 className="text-2xl font-semibold text-slate-300 mb-2">
                            No LMS data yet
                        </h2>
                        <p className="text-slate-400">
                            Set up your LMS integration in settings to see your courses,
                            assignments, and announcements.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
