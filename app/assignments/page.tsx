"use client";

import { db } from "@/lib/firebaseClient";
import { useAuth } from "@/context/authContext";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import { FileText, Calendar, CheckCircle, Circle } from "lucide-react";

export default function Assignments() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [assignments, setAssignments] = useState<any[]>([]);
    const [fetching, setFetching] = useState(true);
    const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "notCompleted">("all");
    const [subjectFilter, setSubjectFilter] = useState<string>("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.push("/signin");
            return;
        }

        const fetchAssignments = async () => {
            try {
                setFetching(true);
                const assignmentsRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(assignmentsRef);
                const data = docSnap.data()?.data.assignments;
                setAssignments(data ? Object.values(data) : []);
            } catch (err) {
                console.error("Failed to fetch assignments:", err);
            } finally {
                setFetching(false);
            }
        };

        fetchAssignments();
    }, [user, loading, router]);

    const subjects = Array.from(new Set(assignments.map((a) => a.courseName)));

    const filteredAssignments = assignments.filter((a) => {
        if (statusFilter === "completed" && a.submissionState !== "submitted") return false;
        if (statusFilter === "notCompleted" && a.submissionState === "submitted") return false;
        if (subjectFilter !== "all" && a.courseName !== subjectFilter) return false;
        if ((dateFrom && new Date(a.dueAt) < new Date(dateFrom)) || !a.dueAt) return false;
        if (dateTo && new Date(a.dueAt) > new Date(dateTo)) return false;
        return true;
    });

    return (
        <AppLayout title="Assignments">
            {/* Filters */}
            <div className="sticky top-14 md:top-0 z-20 bg-slate-800/40 backdrop-blur-md border-b border-slate-700/50 px-6 py-4">
                <div className="max-w-7xl mx-auto flex flex-wrap gap-3">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all"
                    >
                        <option value="all">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="notCompleted">Not Completed</option>
                    </select>

                    <select
                        value={subjectFilter}
                        onChange={(e) => setSubjectFilter(e.target.value)}
                        className="px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all"
                    >
                        <option value="all">All Subjects</option>
                        {subjects.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>

                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all"
                    />
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                {fetching ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-slate-600 border-t-emerald-500 rounded-full animate-spin" />
                            <p className="text-slate-400">Loading assignments...</p>
                        </div>
                    </div>
                ) : assignments.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4 opacity-50" />
                            <h2 className="text-2xl font-semibold text-slate-300 mb-2">
                                No assignments yet
                            </h2>
                            <p className="text-slate-400">Check back later for new assignments</p>
                        </div>
                    </div>
                ) : filteredAssignments.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4 opacity-50" />
                            <h2 className="text-2xl font-semibold text-slate-300 mb-2">
                                No matching assignments
                            </h2>
                            <p className="text-slate-400">Try adjusting your filters</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAssignments.map((a) => (
                            <div
                                key={a.id}
                                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700/40 to-slate-800/40 border border-slate-700/50 hover:border-emerald-500/50 backdrop-blur transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 ring-1 ring-white/10 p-6"
                            >
                                {/* Status indicator */}
                                <div className="absolute top-4 right-4">
                                    {a.submissionState === "submitted" ? (
                                        <CheckCircle className="w-6 h-6 text-emerald-500" />
                                    ) : (
                                        <Circle className="w-6 h-6 text-slate-500" />
                                    )}
                                </div>

                                {/* Title */}
                                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors pr-8 line-clamp-2">
                                    {a.title}
                                </h3>

                                {/* Course */}
                                <p className="text-sm text-slate-400 mb-4">{a.courseName}</p>

                                {/* Due date */}
                                {a.dueAt && (
                                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
                                        <Calendar className="w-4 h-4" />
                                        <span>{new Date(a.dueAt).toLocaleDateString()}</span>
                                    </div>
                                )}

                                {/* Description */}
                                {a.description && (
                                    <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                                        {a.description}
                                    </p>
                                )}

                                {/* Link */}
                                {a.url && (
                                    <a
                                        href={a.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block mt-4 px-4 py-2 bg-emerald-600/20 text-emerald-300 rounded-lg hover:bg-emerald-600/40 transition-colors text-sm font-medium border border-emerald-600/30"
                                    >
                                        Open Assignment
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </ScrollArea>
    );
}
