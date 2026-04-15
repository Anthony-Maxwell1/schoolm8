"use client";
import { css } from "@/lib/css";
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

export default function LMS() {
    const announcementRef = useRef<HTMLDivElement>(null);
    const assignmentRef = useRef<HTMLDivElement>(null);
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
        <div className="">
            {/* Header */}
            <div className={style.main.section.header["ROOT-STYLE"]}>
                <h2 className={style.main.section.header["ROOT-STYLE"]}>{title}</h2>
                <button className={style.main.section.header.seeall["ROOT-STYLE"]}>
                    {style.main.section.header.seeall.CONTENT}
                </button>
            </div>

            {/* Carousel */}
            <div className={style.main.section.carousel["ROOT-STYLE"]}>
                {/* Left Button */}
                <button
                    onClick={() => scroll(refProp, "left")}
                    className={style.main.section.carousel.left["ROOT-STYLE"]}
                >
                    {style.main.section.carousel.left.CONTENT}
                </button>

                {/* Scroll Area */}
                <div ref={refProp} className={style.main.section.carousel.scrollarea["ROOT-STYLE"]}>
                    {data.map((item, i) => (
                        <div
                            key={i}
                            className={style.main.section.carousel.scrollarea.item["ROOT-STYLE"]}
                            onClick={function () {
                                redirect(redirectTemplate.replace("{id}", item.id));
                            }}
                        >
                            {item.image && (
                                <img
                                    src={item.image}
                                    className={
                                        style.main.section.carousel.scrollarea.item.image[
                                            "ROOT-STYLE"
                                        ]
                                    }
                                />
                            )}
                            <div
                                className={
                                    style.main.section.carousel.scrollarea.item.inner["ROOT-STYLE"]
                                }
                            >
                                <h4
                                    className={
                                        style.main.section.carousel.scrollarea.item.inner.title[
                                            "ROOT-STYLE"
                                        ]
                                    }
                                >
                                    {item.title}
                                </h4>
                                <p
                                    className={
                                        style.main.section.carousel.scrollarea.item.inner
                                            .description["ROOT-STYLE"]
                                    }
                                >
                                    {item.description &&
                                        item.description.slice(0, 100) +
                                            (item.description.length > 100 ? "..." : "")}
                                    {item.text &&
                                        item.text.slice(0, 100) +
                                            (item.text.length > 100 ? "..." : "")}
                                </p>
                                {item.due && (
                                    <p
                                        className={
                                            style.main.section.carousel.scrollarea.item.inner.due[
                                                "ROOT-STYLE"
                                            ]
                                        }
                                    >
                                        {
                                            style.main.section.carousel.scrollarea.item.inner.due
                                                .CONTENT
                                        }
                                        {new Date(item.due).toLocaleDateString()}
                                    </p>
                                )}
                                {item.created && (
                                    <p
                                        className={
                                            style.main.section.carousel.scrollarea.item.inner
                                                .created["ROOT-STYLE"]
                                        }
                                    >
                                        {
                                            style.main.section.carousel.scrollarea.item.inner
                                                .created.CONTENT
                                        }
                                        {new Date(item.created).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right Button */}
                <button
                    onClick={() => scroll(refProp, "right")}
                    className={style.main.section.carousel.right["ROOT-STYLE"]}
                >
                    {style.main.section.carousel.right.CONTENT}
                </button>
            </div>
        </div>
    );

    return (
        <div className={style.main["ROOT-STYLE"]}>
            <h1 className={style.main.title["ROOT-STYLE"]}>{style.main.title["CONTENT"]}</h1>

            {/* Announcements */}
            <Section
                title="Announcements"
                redirectTemplate="/lms/announcement/{id}?cameFrom=/lms"
                data={announcements}
                refProp={announcementRef}
            />

            {/* Assignments */}
            <Section
                title="Assignments"
                redirectTemplate="/lms/assignment/{id}?cameFrom=/lms"
                data={assignments}
                refProp={assignmentRef}
            />

            {/* Courses */}
            <div className={style.main.courses["ROOT-STYLE"]}>
                <h2 className={style.main.courses["ROOT-STYLE"]}>
                    {style.main.courses.title["CONTENT"]}
                </h2>

                <div className={style.main.courses.inner["ROOT-STYLE"]}>
                    {courses.map((course, i) => (
                        <div
                            key={i}
                            className={style.main.courses.inner.course["ROOT-STYLE"]}
                            onClick={function () {
                                redirect(`/lms/course/${course.id}?cameFrom=/lms`);
                            }}
                        >
                            <img
                                src={course.image}
                                className={style.main.courses.inner.course.image["ROOT-STYLE"]}
                            />

                            {/* Overlay */}
                            <div
                                className={style.main.courses.inner.course.overlay["ROOT-STYLE"]}
                            />

                            {/* Text */}
                            <div className={style.main.courses.inner.course.name["ROOT-STYLE"]}>
                                <h3
                                    className={
                                        style.main.courses.inner.course.name.inner["ROOT-STYLE"]
                                    }
                                >
                                    {course.name}
                                </h3>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
