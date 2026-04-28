"use client";

import { db } from "@/lib/firebaseClient";
import { useAuth } from "@/context/authContext";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Calendar, CheckCircle, Circle } from "lucide-react";
import { useAccessControl } from "@/lib/access/useAccessControl";
import { useCss } from "@/lib/css";

export default function Assignments() {
    const { loading: accessLoading, allowed } = useAccessControl("assignments");
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [assignments, setAssignments] = useState<any[]>([]);
    const [fetching, setFetching] = useState(true);
    const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "notCompleted">("all");
    const [subjectFilter, setSubjectFilter] = useState<string>("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const { css } = useCss();
    const style = css.app.assignments.page;

    useEffect(() => {
        if (authLoading || accessLoading) return;

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
    }, [user, authLoading, accessLoading, router]);

    const subjects = Array.from(new Set(assignments.map((a) => a.courseName)));

    const filteredAssignments = assignments.filter((a) => {
        if (statusFilter === "completed" && a.submissionState !== "submitted") return false;
        if (statusFilter === "notCompleted" && a.submissionState === "submitted") return false;
        if (subjectFilter !== "all" && a.courseName !== subjectFilter) return false;
        if ((dateFrom && new Date(a.dueAt) < new Date(dateFrom)) || !a.dueAt) return false;
        if (dateTo && new Date(a.dueAt) > new Date(dateTo)) return false;
        return true;
    });

    if (authLoading || accessLoading) {
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

    return (
        <div className={style.main["ROOT-STYLE"]}>
            {/* Filters */}
            <div className={style.toolbar["ROOT-STYLE"]}>
                <div className={style.toolbarInner["ROOT-STYLE"]}>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className={style.select["ROOT-STYLE"]}
                    >
                        <option value="all">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="notCompleted">Not Completed</option>
                    </select>

                    <select
                        value={subjectFilter}
                        onChange={(e) => setSubjectFilter(e.target.value)}
                        className={style.select["ROOT-STYLE"]}
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
                        className={style.dateInput["ROOT-STYLE"]}
                    />
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className={style.dateInput["ROOT-STYLE"]}
                    />
                </div>
            </div>

            {/* Content */}
            <div className={style.content["ROOT-STYLE"]}>
                {fetching ? (
                    <div className={style.loading["ROOT-STYLE"]}>
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-600 border-t-emerald-500" />
                            <p className="text-slate-400">Loading assignments...</p>
                        </div>
                    </div>
                ) : assignments.length === 0 ? (
                    <div className={style.loading["ROOT-STYLE"]}>
                        <div className="text-center">
                            <FileText className="mx-auto mb-4 h-16 w-16 text-slate-600 opacity-50" />
                            <h2
                                className={
                                    style.emptyCard["ROOT-STYLE"] +
                                    " mb-2 text-2xl font-semibold text-slate-300"
                                }
                            >
                                No assignments yet
                            </h2>
                            <p className="text-slate-400">Check back later for new assignments</p>
                        </div>
                    </div>
                ) : filteredAssignments.length === 0 ? (
                    <div className={style.loading["ROOT-STYLE"]}>
                        <div className="text-center">
                            <FileText className="mx-auto mb-4 h-16 w-16 text-slate-600 opacity-50" />
                            <h2
                                className={
                                    style.emptyCard["ROOT-STYLE"] +
                                    " mb-2 text-2xl font-semibold text-slate-300"
                                }
                            >
                                No matching assignments
                            </h2>
                            <p className="text-slate-400">Try adjusting your filters</p>
                        </div>
                    </div>
                ) : (
                    <div className={style.grid["ROOT-STYLE"]}>
                        {filteredAssignments.map((a) => (
                            <div key={a.id} className={style.card["ROOT-STYLE"]}>
                                {/* Status indicator */}
                                <div className={style.statusIcon["ROOT-STYLE"]}>
                                    {a.submissionState === "submitted" ? (
                                        <CheckCircle className="h-6 w-6 text-emerald-500" />
                                    ) : (
                                        <Circle className="h-6 w-6 text-slate-500" />
                                    )}
                                </div>

                                {/* Title */}
                                <h3 className={style.title["ROOT-STYLE"]}>{a.title}</h3>

                                {/* Course */}
                                <p className={style.course["ROOT-STYLE"]}>{a.courseName}</p>

                                {/* Due date */}
                                {a.dueAt && (
                                    <div className={style.dueRow["ROOT-STYLE"]}>
                                        <Calendar className="h-4 w-4" />
                                        <span>{new Date(a.dueAt).toLocaleDateString()}</span>
                                    </div>
                                )}

                                {/* Description */}
                                {a.description && (
                                    <p className={style.desc["ROOT-STYLE"]}>{a.description}</p>
                                )}

                                {/* Link */}
                                {a.url && (
                                    <a
                                        href={a.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={style.link["ROOT-STYLE"]}
                                    >
                                        {style.link.CONTENT}
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
