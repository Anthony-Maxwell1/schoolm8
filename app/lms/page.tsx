"use client";
import { css } from "@/lib/css";
import { redirect } from "next/dist/client/components/navigation";
import { useRef } from "react";

const announcements = [
    {
        title: "Exam Schedule Released",
        description: "Check your exam timetable for Term 2.",
        image: "https://picsum.photos/400?1",
        id: "1254",
        created: "2024-06-01T10:00:00Z",
    },
    {
        title: "Sports Carnival",
        description: "Don't forget to sign up for events!",
        image: "https://picsum.photos/400?2",
        id: "2354",
        created: "2024-07-01T10:00:00Z",
    },
    {
        title: "Library Update",
        description: "New study spaces now available.",
        image: "https://picsum.photos/400?3",
        id: "3454",
        created: "2024-05-01T10:00:00Z",
    },
];

const assignments = [
    {
        title: "Math Homework",
        description: "Complete exercises 5–10.",
        image: "https://picsum.photos/400?4",
        id: "1284",
        created: "2024-06-02T10:00:00Z",
        due: "2024-06-09T10:00:00Z",
    },
    {
        title: "Science Report",
        description: "Submit your experiment findings.",
        image: "https://picsum.photos/400?5",
        id: "2384",
        created: "2024-03-01T10:00:00Z",
        due: "2024-06-09T10:00:00Z",
    },
];

const courses = [
    {
        name: "Mathematics",
        image: "https://picsum.photos/500?10",
        id: "108",
    },
    {
        name: "Science",
        image: "https://picsum.photos/500?11",
        id: "109",
    },
    {
        name: "English",
        image: "https://picsum.photos/500?12",
        id: "110",
    },
    {
        name: "History",
        image: "https://picsum.photos/500?13",
        id: "111",
    },
    {
        name: "Geography",
        image: "https://picsum.photos/500?14",
        id: "112",
    },
    {
        name: "PDHPE",
        image: "https://picsum.photos/500?15",
        id: "113",
    },
];

export default function LMS() {
    const announcementRef = useRef<HTMLDivElement>(null);
    const assignmentRef = useRef<HTMLDivElement>(null);
    const style = css.app.lms.page;

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
                            <img
                                src={item.image}
                                className={
                                    style.main.section.carousel.scrollarea.item.image["ROOT-STYLE"]
                                }
                            />
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
                                    {item.description}
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
                redirectTemplate="/lms/announcement/{id}"
                data={announcements}
                refProp={announcementRef}
            />

            {/* Assignments */}
            <Section
                title="Assignments"
                redirectTemplate="/lms/assignment/{id}"
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
                                redirect(`/lms/course/${course.id}`);
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
