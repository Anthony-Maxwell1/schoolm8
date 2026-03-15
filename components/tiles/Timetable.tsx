// import { useData } from "@/context/dataContext";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/authContext";

export function TimetableList() {
    // const { fetchTimetableDay, fetchTimetableWeek } = useData();
    const [timetable, setTimetable] = useState<JSON[]>([]); // Index 0 is today, 1 is today+1, and so on.
    const { user, token, loading } = useAuth();

    useEffect(() => {
        if (loading) return;
        async function fetchTimetable() {
            const res = await fetch(`/api/timetable/fetch?day=today`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (res) {
                setTimetable([await res.json()]);
            }
        }
        if (timetable.length == 0) {
            fetchTimetable();
        }
    });
    return (
        <div>
            <h2>Timetable</h2>
            {timetable.map((a) => {
                return <div key="a">{JSON.stringify(a)}</div>;
            })}
        </div>
    );
}

export function TimetableGrid() {
    return (
        <div>
            <h2>Timetable</h2>
        </div>
    );
}
