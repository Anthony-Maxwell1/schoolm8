"use client";
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
        <div className="w-full max-w-6xl">
            {/* Header */}
            <div className="flex justify-between items-center mb-3">
                <h2 className="text-2xl font-semibold">{title}</h2>
                <button className="text-blue-500 hover:underline cursor-pointer">See all</button>
            </div>

            {/* Carousel */}
            <div className="relative">
                {/* Left Button */}
                <button
                    onClick={() => scroll(refProp, "left")}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md p-2 rounded-full hover:scale-105 transition cursor-pointer"
                >
                    ←
                </button>

                {/* Scroll Area */}
                <div
                    ref={refProp}
                    className="flex gap-4 overflow-x-auto scroll-smooth no-scrollbar pb-2 px-8"
                >
                    {data.map((item, i) => (
                        <div
                            key={i}
                            className="min-w-[260px] bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer"
                            onClick={function () {
                                redirect(redirectTemplate.replace("{id}", item.id));
                            }}
                        >
                            <img src={item.image} className="w-full h-32 object-cover" />
                            <div className="p-3">
                                <h4 className="font-semibold">{item.title}</h4>
                                <p className="text-sm text-gray-600">{item.description}</p>
                                {item.due && (
                                    <p className="text-sm text-red-500 mt-1">
                                        Due: {new Date(item.due).toLocaleDateString()}
                                    </p>
                                )}
                                {item.created && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        Created: {new Date(item.created).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right Button */}
                <button
                    onClick={() => scroll(refProp, "right")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md p-2 rounded-full hover:scale-105 transition cursor-pointer"
                >
                    →
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center gap-10">
            <h1 className="text-4xl font-bold">LMS Dashboard</h1>

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
            <div className="w-full max-w-6xl">
                <h2 className="text-2xl font-semibold mb-3">Courses</h2>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {courses.map((course, i) => (
                        <div
                            key={i}
                            className="relative h-40 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition cursor-pointer group"
                            onClick={function () {
                                redirect(`/lms/course/${course.id}`);
                            }}
                        >
                            <img
                                src={course.image}
                                className="w-full h-full object-cover group-hover:scale-105 transition"
                            />

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition" />

                            {/* Text */}
                            <div className="absolute bottom-3 left-3 text-white">
                                <h3 className="font-semibold text-lg">{course.name}</h3>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
