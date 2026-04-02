"use client";
// app/lms/assignment/[id]/page.tsx

import { css } from "@/lib/css";
import { useState, useEffect } from "react";
import { Announcement, normalizeAnnouncement } from "@/lib/lmsNormaliser";
import { useAuth } from "@/context/authContext";
import { useParams } from "next/navigation";
import { LMSAnnouncement } from "@/app/api/canvas/sync/route";
import { ClassroomAnnouncement } from "@/app/api/googleclassroom/sync/route";

function getMaxRows(obj: Record<string, any[]>) {
    return Math.max(...Object.values(obj).map((arr) => arr.length));
}

export default function AssignmentPage({ params }: { params: { id: string } }) {
    const { id } = useParams();
    const { user, token, loading } = useAuth();

    const style = css.app.lms.assignment;

    const [data, setData] = useState<Announcement | null>(null);

    useEffect(() => {
        if (loading || !user || !token) return;

        fetch("/api/lms/announcements", { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => res.json())
            .then((res) => {
                if (res.error === "NEXT_REDIRECT") {
                    console.warn("Redirect occurred — navigate manually");
                    window.location.href = "/lms";
                } else {
                    const announcementsArray = Object.values(res.announcements) as
                        | LMSAnnouncement[]
                        | ClassroomAnnouncement[];
                    const announcement = announcementsArray.find((a) => a.id === id);
                    setData(normalizeAnnouncement(announcement!));
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

                <h1 className={style.header.title["ROOT-STYLE"]}>{data?.title && data?.title}</h1>

                <p className={style.header.course["ROOT-STYLE"]}>{data?.courseName}</p>

                <div className={style.header.dates["ROOT-STYLE"]}>
                    {data?.createdAt && (
                        <span>Created: {new Date(data?.createdAt).toLocaleDateString()}</span>
                    )}
                    {data?.updatedAt && (
                        <span>Updated: {new Date(data?.updatedAt).toLocaleDateString()}</span>
                    )}
                </div>

                <p className={style.header.desc["ROOT-STYLE"]}>{data?.text}</p>

                {data?.url && (
                    <a href={data?.url} target="_blank" className={style.header.link["ROOT-STYLE"]}>
                        Open Resource →
                    </a>
                )}
            </div>
        </div>
    );
}
