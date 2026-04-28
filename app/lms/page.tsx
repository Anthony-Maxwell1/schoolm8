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
import { useAccessControl } from "@/lib/access/useAccessControl";
import { cn } from "@/lib/utils";

export default function LMS() {
    const { allowed, loading: accessLoading } = useAccessControl("lms");
    const announcementRef = useRef<HTMLDivElement>(null);
    const assignmentRef = useRef<HTMLDivElement>(null);
    const { css, setCss } = useCss();
    const style = css.app.lms.page;
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const { user, token, loading } = useAuth();

    useEffect(() => {
        if (loading || accessLoading || !allowed || !user || !token) return;
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
    }, [user, token, loading, accessLoading, allowed]);

    if (loading || accessLoading) {
        return (
            <div className={style.loading["ROOT-STYLE"]}>
                <div className={style.loadingInner["ROOT-STYLE"]}>
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-600 border-t-emerald-500" />
                    <p className="text-slate-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (!allowed) {
        return <div>Unauthorized</div>;
    }

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
        <div className={style.section["ROOT-STYLE"]}>
            {/* Header */}
            <div className={style.sectionHeader["ROOT-STYLE"]}>
                <h2 className={style.sectionTitle["ROOT-STYLE"]}>{title}</h2>
                <button className={style.seeAll["ROOT-STYLE"]}>{style.seeAll.CONTENT}</button>
            </div>

            {/* Carousel */}
            <div className={style.carousel["ROOT-STYLE"]}>
                {/* Left Button */}
                <button
                    onClick={() => scroll(refProp, "left")}
                    className={cn(style.navButton["ROOT-STYLE"], style.navButton.left)}
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Scroll Area */}
                <div ref={refProp} className={style.scrollArea["ROOT-STYLE"]}>
                    {data.map((item, i) => (
                        <div
                            key={i}
                            className={style.card["ROOT-STYLE"]}
                            onClick={function () {
                                redirect(redirectTemplate.replace("{id}", item.id));
                            }}
                        >
                            {item.image && (
                                <img src={item.image} className={style.image["ROOT-STYLE"]} />
                            )}
                            <div>
                                <h4 className={style.title["ROOT-STYLE"]}>{item.title}</h4>
                                <p className={style.desc["ROOT-STYLE"]}>
                                    {item.description &&
                                        item.description.slice(0, 50) +
                                            (item.description.length > 50 ? "..." : "")}
                                    {item.text &&
                                        item.text.slice(0, 50) +
                                            (item.text.length > 50 ? "..." : "")}
                                </p>
                                {item.due && (
                                    <p className={style.meta["ROOT-STYLE"]}>
                                        Due: {new Date(item.due).toLocaleDateString()}
                                    </p>
                                )}
                                {item.created && (
                                    <p className={style.meta["ROOT-STYLE"]}>
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
                    className={cn(style.navButton["ROOT-STYLE"], style.navButton.right)}
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );

    return (
        <div className={style.main["ROOT-STYLE"]}>
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
                <div className={style.section["ROOT-STYLE"]}>
                    <h2 className={style.sectionTitle["ROOT-STYLE"]}>Your Courses</h2>

                    <div className={style.courseGrid["ROOT-STYLE"]}>
                        {courses.map((course, i) => (
                            <div
                                key={i}
                                className={style.courseCard["ROOT-STYLE"]}
                                onClick={function () {
                                    redirect(`/lms/course/${course.id}?cameFrom=/lms`);
                                }}
                            >
                                {/* Image */}
                                <img
                                    src={course.image}
                                    className={style.courseImage["ROOT-STYLE"]}
                                />

                                {/* Overlay */}
                                <div className={style.courseOverlay["ROOT-STYLE"]} />

                                {/* Text */}
                                <div className={style.courseContent["ROOT-STYLE"]}>
                                    <h3 className={style.title["ROOT-STYLE"]}>{course.name}</h3>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {announcements.length === 0 && assignments.length === 0 && courses.length === 0 && (
                <div className={style.empty["ROOT-STYLE"]}>
                    <div className="text-center">
                        <h2 className={style.emptyTitle["ROOT-STYLE"]}>
                            {style.emptyTitle.CONTENT}
                        </h2>
                        <p className={style.emptyText["ROOT-STYLE"]}>
                            Set up your LMS integration in settings to see your courses,
                            assignments, and announcements.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
