"use client";

import { useAuth } from "@/context/authContext";
import { useRouter } from "next/navigation";
import { JSX, useEffect, useState } from "react";
import { db } from "@/lib/firebaseClient";
import { getDoc, doc } from "firebase/firestore";

export default function Schedule() {
    const { user, token, loading } = useAuth();
    const router = useRouter();
    const [schedules, setSchedules] = useState<any>({});
    const [fetching, setFetching] = useState(true);
    const [selectedScheduleIndex, setSelectedScheduleIndex] = useState<any>();

    const fetchSchedule = async () => {
        try {
            setFetching(true);
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);
            const data = docSnap.data()?.data.schedules || [];
            setSchedules(data);
            setSelectedScheduleIndex(Object.keys(data)[0]);
        } catch (error) {
            console.error(error);
        } finally {
            setFetching(false);
        }
    };

    const createSchedule = async () => {
        const res = await fetch("/api/schedule/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                name: "New Schedule",
                elements: [],
            }),
        });
        if (!res.ok) {
            console.error("Failed to create schedule");
        } else {
            // Re-fetch schedules after creating a new one
            await fetchSchedule();
        }
    };

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.push("/signin");
            return;
        }

        fetchSchedule();
    }, [user, loading, router]);

    const createElement = async () => {
        console.log(selectedScheduleIndex);
        fetch("/api/schedule/addElement", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                scheduleId: selectedScheduleIndex,
                element: {
                    timeStart: "09:00",
                    timeEnd: "10:00",
                    title: "New Element",
                },
            }),
        });
    };

    return (
        <div>
            {fetching ? (
                <div>Loading schedule...</div>
            ) : (
                <div>
                    {!schedules || schedules.length === 0 ? (
                        <div>No schedules available.</div>
                    ) : (
                        <div>
                            <label>
                                Select Schedule:&nbsp;
                                <select
                                    value={selectedScheduleIndex}
                                    onChange={(e) => setSelectedScheduleIndex(e.target.value)}
                                >
                                    {Object.entries(schedules).map(
                                        ([id, schedule]: [string, any], idx: number) => (
                                            <option key={id} value={id}>
                                                {schedule.name || `Schedule ${idx + 1}`}
                                            </option>
                                        ),
                                    )}
                                </select>
                                <button onClick={createElement}>Create New Element</button>
                            </label>
                            <ul>
                                {Object.values(
                                    schedules[selectedScheduleIndex]?.elements || {},
                                ).map((item: any, index: number) => (
                                    <li key={index}>{item.title}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
            <button
                onClick={createSchedule}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
            >
                Create New Schedule
            </button>
        </div>
    );
}
