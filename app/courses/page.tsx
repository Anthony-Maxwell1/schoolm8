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

export default function CoursesPage() {
    const { user, token, loading } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const { allowed, loading: accessLoading } = useAccessControl("courses");

    if (loading || accessLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-slate-600 border-t-emerald-500 rounded-full animate-spin" />
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
            <div className="sticky top-14 md:top-0 z-20 bg-slate-800/40 backdrop-blur-md border-b border-slate-700/50 px-6 py-4">
                <div className="max-w-7xl mx-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search courses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-slate-600 border-t-emerald-500 rounded-full animate-spin" />
                            <p className="text-slate-400">Loading courses...</p>
                        </div>
                    </div>
                ) : filteredCourses.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4 opacity-50" />
                            <h2 className="text-2xl font-semibold text-slate-300 mb-2">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCourses.map((course) => (
                            <Link
                                key={course.id}
                                href={`/courses/${course.id}`}
                                className="group relative overflow-hidden rounded-2xl bg-linear-to-br from-slate-700/40 to-slate-800/40 border border-slate-700/50 hover:border-emerald-500/50 backdrop-blur transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 ring-1 ring-white/10"
                            >
                                {/* Course Image */}
                                {course.image && (
                                    <div className="relative h-40 overflow-hidden">
                                        <img
                                            src={course.image}
                                            alt={course.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        />
                                        <div className="absolute inset-0 bg-linear-to-b from-transparent to-slate-900/80" />
                                    </div>
                                )}

                                {/* Content */}
                                <div className="p-6">
                                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors line-clamp-2">
                                        {course.name}
                                    </h3>
                                    {course.description && (
                                        <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                                            {course.description}
                                        </p>
                                    )}

                                    {/* Footer */}
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-600/30">
                                        <div className="text-xs text-slate-500">
                                            {course.id ? `ID: ${course.id.slice(0, 8)}...` : ""}
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
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
