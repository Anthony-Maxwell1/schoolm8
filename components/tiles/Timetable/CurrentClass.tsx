import { useAuth } from "@/context/authContext";
import { useEffect, useState } from "react";
import { StandardTimetable } from "@/lib/timetableNormaliser";

const formatTime = (date: Date) =>
    date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false, // set true if you want AM/PM
    });

export function A() {
    const [currentClass, setCurrentClass] = useState({
        name: "Loading...",
        room: "Loading...",
        time: "12:00 - 12:00",
        teacher: "Loading...",
    });
    const [day, setDay] = useState<StandardTimetable | undefined>(undefined);
    const [currIdx, setCurrIdx] = useState(0);
    const { loading, token } = useAuth();
    useEffect(() => {
        if (loading || !token) return;
        // Simulate fetching current class data
        const fetchCurrentClass = async () => {
            const res = await fetch("/api/timetable/fetch?day=today", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data: StandardTimetable = (await res.json()).timetable;
            setDay(data);
            console.log(data);
            let found = false;
            data.events.forEach((cls) => {
                if (new Date(cls.start) <= new Date() && new Date(cls.end) >= new Date()) {
                    setCurrentClass({
                        name: cls.title,
                        room: cls.room || "TBA",
                        time: `${formatTime(new Date(cls.start))} - ${formatTime(new Date(cls.end))}`,
                        teacher: cls.teacher || "Unknown",
                    });
                    found = true;
                    setCurrIdx((prev) => prev + 1);
                }
                console.log(new Date(cls.start), new Date(), new Date(cls.end));
            });
            if (data.events.length === 0) {
                setCurrentClass({
                    name: "No classes today!",
                    room: "Enjoy your day off",
                    time: "",
                    teacher: "",
                });
            } else if (!found) {
                setCurrentClass({
                    name: "First class today " + formatTime(new Date(data.events[0].start)),
                    room: data.events[0].room || "TBA",
                    time: "No class right now!",
                    teacher: data.events[0].title,
                });
            }
        };

        fetchCurrentClass();
    }, []);

    const next = () => {
        if (!day || currIdx >= day.events.length) return;
        const cls = day.events[currIdx + 1];
        setCurrentClass({
            name: cls.title,
            room: cls.room || "TBA",
            time: `${formatTime(new Date(cls.start))} - ${formatTime(new Date(cls.end))}`,
            teacher: cls.teacher || "Unknown",
        });
        setCurrIdx((prev) => Math.min(prev, day.events.length - 1) + 1);
    };

    const prev = () => {
        if (!day || currIdx <= 1) return;
        const cls = day.events[currIdx - 2];
        setCurrentClass({
            name: cls.title,
            room: cls.room || "TBA",
            time: `${formatTime(new Date(cls.start))} - ${formatTime(new Date(cls.end))}`,
            teacher: cls.teacher || "Unknown",
        });
        setCurrIdx((prev) => Math.max(0, prev - 1));
    };

    return (
        <div className="relative grid grid-rows-[auto_1fr_auto] bg-blue-100 rounded-xl w-full h-full p-3 shadow-sm">
            {/* TOP ROW */}
            <div className="flex justify-between items-start text-xs text-blue-600">
                <button className="opacity-70" onClick={prev}>
                    ← Prev
                </button>
                <button className="opacity-70" onClick={next}>
                    Next →
                </button>
            </div>

            {/* CENTER (main focus) */}
            <div className="flex flex-col items-center justify-center text-center">
                <div className="text-3xl font-bold text-blue-800 leading-none">
                    {currentClass.room}
                </div>
                <div className="text-sm text-blue-600 mt-1">{currentClass.name}</div>
                <div className="text-sm text-blue-700 mt-2 font-medium">{currentClass.time}</div>
            </div>

            {/* BOTTOM ROW */}
            <div className="flex justify-between items-end text-xs text-blue-600">
                <span>{currentClass.teacher}</span>
            </div>
        </div>
    );
}

export function B() {
    return (
        <div className="flex w-full h-full items-center justify-between gap-3 px-3">
            {/* LEFT */}
            <div className="flex min-w-0 items-baseline gap-2 flex-1">
                <span className="truncate text-[11px] text-blue-500">Mr Smith</span>
                <span className="truncate text-sm font-semibold text-blue-900">Maths</span>
            </div>

            {/* CENTER */}
            <div className="flex justify-center ">
                <span className="text-xl font-bold text-blue-900 tracking-tight">S134</span>
            </div>

            {/* RIGHT */}
            <div className="flex justify-end items-baseline flex-1">
                <span className="text-[11px] text-blue-600 whitespace-nowrap font-medium">
                    12:00–13:00
                </span>
            </div>
        </div>
    );
}
