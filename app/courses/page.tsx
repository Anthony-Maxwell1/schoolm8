"use client";

import { useAuth } from "@/context/authContext";
import { Course, normaliseCourse } from "@/lib/lmsNormaliser";
import { CanvasCourse } from "../api/canvas/sync/route";
import { ClassroomCourse } from "../api/googleclassroom/sync/route";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, ArrowRight, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAccessControl } from "@/lib/access/useAccessControl";
import { useCss } from "@/lib/css";

export default function CoursesPage() {
    const { user, token, loading } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const { allowed, loading: accessLoading } = useAccessControl("courses");
    const { css } = useCss();
    const style = css.app.courses.page;

    if (loading || accessLoading) {
        return (
            <div className={style.loading["ROOT-STYLE"]}>
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-600 border-t-emerald-500" />
                    <p className="text-slate-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (!allowed) {
        router.replace("/unauthorized");
        return null;
    }

    useEffect(() => {
        if (loading || !user || !token) return;

        setIsLoading(true);
        fetch("/api/lms/courses", { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => res.json())
            .then((data) => {
                const coursesData = Object.values(data.courses) as (
                    | ClassroomCourse
                    | CanvasCourse
                )[];
                const normalized = coursesData.map((c) => normaliseCourse(c));
                setCourses(normalized);
                setFilteredCourses(normalized);
            })
            .catch((err) => {
                console.error("Failed to fetch courses:", err);
                setCourses([]);
                setFilteredCourses([]);
            })
            .finally(() => setIsLoading(false));
    }, [user, token, loading]);

    // Filter courses based on search query
    useEffect(() => {
        const filtered = courses.filter(
            (course) =>
                course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                course.description?.toLowerCase().includes(searchQuery.toLowerCase()),
        );
        setFilteredCourses(filtered);
    }, [searchQuery, courses]);

    return (
        <div>
            {/* Search Bar */}
            <div className={style.toolbar["ROOT-STYLE"]}>
                <div className={style.toolbarInner["ROOT-STYLE"]}>
                    <div className={style.searchWrap["ROOT-STYLE"]}>
                        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search courses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={style.searchInput["ROOT-STYLE"]}
                        />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className={style.content["ROOT-STYLE"]}>
                {isLoading ? (
                    <div className={style.loading["ROOT-STYLE"]}>
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-600 border-t-emerald-500" />
                            <p className="text-slate-400">Loading courses...</p>
                        </div>
                    </div>
                ) : filteredCourses.length === 0 ? (
                    <div className={style.loading["ROOT-STYLE"]}>
                        <div className="text-center">
                            <BookOpen className="mx-auto mb-4 h-16 w-16 text-slate-600 opacity-50" />
                            <h2
                                className={
                                    style.emptyCard["ROOT-STYLE"] +
                                    " mb-2 text-2xl font-semibold text-slate-300"
                                }
                            >
                                No courses found
                            </h2>
                            <p className="text-slate-400">
                                {searchQuery
                                    ? "Try adjusting your search query"
                                    : "You haven't enrolled in any courses yet"}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className={style.grid["ROOT-STYLE"]}>
                        {filteredCourses.map((course) => (
                            <Link
                                key={course.id}
                                href={`/courses/${course.id}`}
                                className={style.card["ROOT-STYLE"]}
                            >
                                {/* Course Image */}
                                {course.image && (
                                    <div className={style.imageWrap["ROOT-STYLE"]}>
                                        <img
                                            src={course.image}
                                            alt={course.name}
                                            className={style.image["ROOT-STYLE"]}
                                        />
                                        <div className={style.overlay["ROOT-STYLE"]} />
                                    </div>
                                )}

                                {/* Content */}
                                <div className={style.inner["ROOT-STYLE"]}>
                                    <h3 className={style.title["ROOT-STYLE"]}>{course.name}</h3>
                                    {course.description && (
                                        <p className={style.desc["ROOT-STYLE"]}>
                                            {course.description}
                                        </p>
                                    )}

                                    {/* Footer */}
                                    <div className={style.footer["ROOT-STYLE"]}>
                                        <div className={style.footerText["ROOT-STYLE"]}>
                                            {course.id ? `ID: ${course.id.slice(0, 8)}...` : ""}
                                        </div>
                                        <ArrowRight className={style.arrow["ROOT-STYLE"]} />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
