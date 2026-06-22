"use client";
// app/lms/assignment/[id]/page.tsx

import { useCss } from "@/lib/css";
import { useState, useEffect } from "react";
import { Announcement, normaliseAnnouncement } from "@/lib/lmsNormaliser";
import { useAuth } from "@/context/authContext";
import { redirect, useParams } from "next/navigation";
import { LMSAnnouncement } from "@/app/api/canvas/sync/route";
import { ClassroomAnnouncement } from "@/app/api/googleclassroom/sync/route";
import { navigate } from "next/dist/client/components/segment-cache/navigation";
import { useAccessControl } from "@/lib/access/useAccessControl";
import utils from "@/lib/utils";

function getMaxRows(obj: Record<string, any[]>) {
    return Math.max(...Object.values(obj).map((arr) => arr.length));
}

export default function AssignmentPage({ params }: { params: { id: string; cameFrom?: string } }) {
    const { id } = useParams();
    const { allowed, loading: accessLoading } = useAccessControl("lms/announcement/[id]");
    const { user, token, loading } = useAuth();

    const { css } = useCss();

    const style = css.app.lms.announcement;

    const [data, setData] = useState<Announcement | null>(null);

    useEffect(() => {
        if (loading || accessLoading || !allowed || !user || !token) return;

        // fetch("/api/lms/announcements", { headers: { Authorization: `Bearer ${token}` } })
        //     .then((res) => res.json())
        //     .then((res) => {
        //         if (res.error === "NEXT_REDIRECT") {
        //             console.warn("Redirect occurred — navigate manually");
        //             window.location.href = "/lms";
        //         } else {
        //             const announcementsArray = Object.values(res.announcements) as
        //                 | LMSAnnouncement[]
        //                 | ClassroomAnnouncement[];
        //             const announcement = announcementsArray.find((a) => a.id === id);
        //             setData(normaliseAnnouncement(announcement!));
        //         }
        //     })
        //     .catch((err) => console.error(err));
        utils.firebase.schema.lms
            .getAnnouncements(user.uid)
            .then((d) => {
                const announcement = Object.values(d).find((a) => a.id === id);
                if (!announcement) {
                    console.warn("Announcement not found, redirecting to /lms");
                    redirect("/lms");
                } else {
                    setData(normaliseAnnouncement(announcement));
                }
            })
            .catch((err) => console.error(err));
    }, [loading, user, token, id, accessLoading, allowed]); // <== run only when these change

    if (loading || accessLoading) {
        return <div className="min-h-screen" />;
    }

    if (!allowed) {
        return <div>Unauthorized</div>;
    }

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

                <div className={style.header.links["ROOT-STYLE"]}>
                    {data?.url && (
                        <a
                            href={data?.url}
                            target="_blank"
                            className={style.header.links.link["ROOT-STYLE"]}
                        >
                            Open Resource →
                        </a>
                    )}
                    <a
                        href={params.cameFrom ? params.cameFrom : "/lms"}
                        target="_blank"
                        className={style.header.links.link["ROOT-STYLE"]}
                    >
                        Go Back →
                    </a>
                </div>
            </div>
        </div>
    );
}
