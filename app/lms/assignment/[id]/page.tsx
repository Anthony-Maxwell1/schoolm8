"use client";
// app/lms/assignment/[id]/page.tsx

import { css } from "@/lib/css";
import { useState, useEffect } from "react";
import { Assignment, normalizeAssignment } from "@/lib/lmsNormaliser";
import { useAuth } from "@/context/authContext";
import { useParams } from "next/navigation";
import { ClassroomAssignment } from "@/app/api/googleclassroom/sync/route";
import { LMSAssignment } from "@/app/api/canvas/sync/route";

function getMaxRows(obj: Record<string, any[]>) {
    return Math.max(...Object.values(obj).map((arr) => arr.length));
}

export default function AssignmentPage({ params }: { params: { id: string } }) {
    const { id } = useParams();
    const { user, token, loading } = useAuth();

    const style = css.app.lms.assignment;

    const [data, setData] = useState<Assignment | null>(null);

    const headers = data?.rubric && Object.keys(data?.rubric);
    const maxRows = data?.rubric && getMaxRows(data?.rubric);

    useEffect(() => {
        if (loading || !user || !token) return;

        fetch("/api/lms/assignments", { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => res.json())
            .then((res) => {
                if (res.error === "NEXT_REDIRECT") {
                    console.warn("Redirect occurred — navigate manually");
                    window.location.href = "/lms";
                } else {
                    const assignmentsArray = Object.values(res.assignments) as
                        | ClassroomAssignment[]
                        | LMSAssignment[];
                    const assignment = assignmentsArray.find((a) => a.id === id);
                    setData(normalizeAssignment(assignment!));
                }
            })
            .catch((err) => console.error(err));
    }, [loading, user, token, id]); // <== run only when these change

    return (
        <div className={style.main["ROOT-STYLE"]}>
            {/* Header Card */}
            <div className={style.header.card["ROOT-STYLE"]}>
                <p className={style.header.meta["ROOT-STYLE"]}>
                    {id} •{" "}
                    {(data?.source == "classroom" && "Google Classroom") ||
                        (data?.source == "canvas" && "Canvas") ||
                        (data?.source == "moodle" && "Moodle")}
                </p>

                <h1 className={style.header.title["ROOT-STYLE"]}>{data?.title}</h1>

                <p className={style.header.course["ROOT-STYLE"]}>{data?.courseName}</p>

                <div className={style.header.dates["ROOT-STYLE"]}>
                    {data?.created && <span>Created: {data?.created.toLocaleDateString()}</span>}
                    {data?.dueAt && (
                        <span className={style.header.due["ROOT-STYLE"]}>
                            Due:{" "}
                            {data?.dueAt
                                ? new Date(data.dueAt).toLocaleDateString()
                                : "No due date"}
                        </span>
                    )}
                </div>

                <p className={style.header.desc["ROOT-STYLE"]}>{data?.description}</p>

                {data?.url && (
                    <a href={data?.url} target="_blank" className={style.header.link["ROOT-STYLE"]}>
                        Open Resource →
                    </a>
                )}
            </div>

            {/* Rubric */}
            {data?.rubric && headers && maxRows && (
                <div className={style.rubric.card["ROOT-STYLE"]}>
                    <h2 className={style.rubric.title["ROOT-STYLE"]}>
                        {style.rubric.title.CONTENT}
                    </h2>

                    <div className={style.rubric.tableWrapper["ROOT-STYLE"]}>
                        <table className={style.rubric.table["ROOT-STYLE"]}>
                            <thead>
                                <tr>
                                    {headers.map((h) => (
                                        <th
                                            key={h}
                                            className={style.rubric.table.header["ROOT-STYLE"]}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>
                                {Array.from({ length: maxRows }).map((_, row) => (
                                    <tr key={row}>
                                        {headers.map((h) => (
                                            <td
                                                key={h}
                                                className={style.rubric.table.cell["ROOT-STYLE"]}
                                            >
                                                {data?.rubric![h][row] ?? ""}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
