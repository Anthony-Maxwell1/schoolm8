import React, { createContext, useContext, useRef, useState, ReactNode } from "react";
import { useAuth } from "@/context/authContext";
type Timetable = any; // Replace with real type

type DataContextType = {
    timetable: Timetable | "__WAIT__" | null;
    fetchTimetable: () => Promise<Timetable>;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
    const [timetable, setTimetable] = useState<Timetable | "__WAIT__" | null>(null);
    const { user, token, loading } = useAuth();

    // Holds the active in-flight promise
    const timetablePromiseRef = useRef<Promise<Timetable> | null>(null);

    const fetchTimetable = async (): Promise<Timetable> => {
        // ✅ 1. If already loaded, return immediately
        if (timetable && timetable !== "__WAIT__") {
            return Promise.resolve(timetable);
        }

        // ✅ 2. If request already running, wait for it
        if (timetablePromiseRef.current) {
            return timetablePromiseRef.current;
        }

        // ✅ 3. Otherwise start new request
        setTimetable("__WAIT__");

        const fetchPromise = fetch("/api/timetable/fetch", {
            method: "GET",
            headers: {
                Authorization: token,
            },
        })
            .then(async (res) => {
                if (!res.ok) throw new Error("Failed to fetch timetable");
                return res.json();
            })
            .then((data) => {
                setTimetable(data);
                timetablePromiseRef.current = null;
                return data;
            })
            .catch((err) => {
                timetablePromiseRef.current = null;
                setTimetable(null);
                throw err;
            });

        timetablePromiseRef.current = fetchPromise;

        return fetchPromise;
    };

    return (
        <DataContext.Provider
            value={{
                timetable,
                fetchTimetable,
            }}
        >
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error("useData must be used inside DataProvider");
    }
    return context;
};
