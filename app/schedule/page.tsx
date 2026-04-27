"use client";

import { useAuth } from "@/context/authContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseClient";
import { getDoc, doc } from "firebase/firestore";
import { Calendar, Plus, Trash2 } from "lucide-react";
import { useAccessControl } from "@/lib/access/useAccessControl";

export default function Schedule() {
    const { allowed, loading: accessLoading } = useAccessControl("schedule");
    const { user, token, loading } = useAuth();
    const router = useRouter();
    const [schedules, setSchedules] = useState<any>({});
    const [fetching, setFetching] = useState(true);
    const [selectedScheduleIndex, setSelectedScheduleIndex] = useState<any>();

    const fetchSchedule = async () => {
        try {
            setFetching(true);
            const docRef = doc(db, "users", user!.uid);
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
            await fetchSchedule();
        }
    };

    useEffect(() => {
        if (loading || accessLoading || !allowed) return;

        if (!user) {
            router.push("/signin");
            return;
        }

        fetchSchedule();
    }, [user, loading, router, accessLoading, allowed]);

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
        return <div>Unauthorized</div>;
    }

    const createElement = async () => {
        await fetch("/api/schedule/addElement", {
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
        await fetchSchedule();
    };

    const scheduleCount = Object.keys(schedules).length;

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            {fetching ? (
                <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-slate-600 border-t-emerald-500 rounded-full animate-spin" />
                        <p className="text-slate-400">Loading schedules...</p>
                    </div>
                </div>
            ) : scheduleCount === 0 ? (
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4 opacity-50" />
                        <h2 className="text-2xl font-semibold text-slate-300 mb-2">
                            No schedules yet
                        </h2>
                        <p className="text-slate-400 mb-6">
                            Create your first schedule to get started
                        </p>
                        <button
                            onClick={createSchedule}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                        >
                            <Plus className="w-5 h-5" />
                            Create Schedule
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Schedule Selector */}
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div className="flex-1 min-w-0">
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Select Schedule
                            </label>
                            <select
                                value={selectedScheduleIndex}
                                onChange={(e) => setSelectedScheduleIndex(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                            >
                                {Object.entries(schedules).map(
                                    ([id, schedule]: [string, any], idx: number) => (
                                        <option key={id} value={id}>
                                            {schedule.name || `Schedule ${idx + 1}`}
                                        </option>
                                    ),
                                )}
                            </select>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={createElement}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                Add Element
                            </button>
                            <button
                                onClick={createSchedule}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors font-medium text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                New Schedule
                            </button>
                        </div>
                    </div>

                    {/* Elements List */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-white">Schedule Elements</h3>

                        {selectedScheduleIndex &&
                        Object.values(schedules[selectedScheduleIndex]?.elements || {}).length >
                            0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.values(
                                    schedules[selectedScheduleIndex]?.elements || {},
                                ).map((item: any, index: number) => (
                                    <div
                                        key={index}
                                        className="rounded-lg bg-linear-to-br from-slate-700/40 to-slate-800/40 border border-slate-700/50 backdrop-blur p-4 flex items-start justify-between"
                                    >
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-white mb-2">
                                                {item.title}
                                            </h4>
                                            {item.timeStart && item.timeEnd && (
                                                <p className="text-sm text-slate-400">
                                                    {item.timeStart} - {item.timeEnd}
                                                </p>
                                            )}
                                        </div>
                                        <button className="p-2 text-red-400 hover:text-red-300 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-lg bg-slate-800/30 border border-slate-700/50 p-8 text-center">
                                <p className="text-slate-400">No elements in this schedule yet</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
