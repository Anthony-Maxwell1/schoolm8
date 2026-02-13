import React, { createContext, useContext, useRef, useState, ReactNode } from "react";
import { useAuth } from "@/context/authContext";

type Timetable = any;

type DataContextType = {
    fetchTimetableDay: (day: string) => Promise<Timetable>;
    fetchTimetableWeek: (weekStart: string) => Promise<Timetable>;
};

type CacheEntry = {
    data?: Timetable;
    promise?: Promise<Timetable>;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
    const { token } = useAuth();

    // Keyed cache: key -> { data, promise }
    const cacheRef = useRef<Record<string, CacheEntry>>({});

    const fetchWithCache = async (key: string, url: string): Promise<Timetable> => {
        const cached = cacheRef.current[key];

        // 1️⃣ Already has data
        if (cached?.data) {
            return cached.data;
        }

        // 2️⃣ Already in-flight
        if (cached?.promise) {
            return cached.promise;
        }

        // 3️⃣ Otherwise start fetch
        const fetchPromise = fetch(url, {
            method: "GET",
            headers: {
                Authorization: token ?? "",
                "Cache-Control": "no-store", // prevent browser cache
            },
        })
            .then(async (res) => {
                if (!res.ok) throw new Error("Failed to fetch timetable");
                return res.json();
            })
            .then((data) => {
                cacheRef.current[key] = { data }; // store resolved data
                return data;
            })
            .catch((err) => {
                cacheRef.current[key] = {}; // clear entry on error
                throw err;
            });

        cacheRef.current[key] = { promise: fetchPromise };
        return fetchPromise;
    };

    const fetchTimetableDay = (day: string) => {
        const key = `timetable-day-${day}`;
        return fetchWithCache(key, `/api/timetable/fetch?day=${day}`);
    };

    const fetchTimetableWeek = (weekStart: string) => {
        const key = `timetable-week-${weekStart}`;
        return fetchWithCache(key, `/api/timetable/fetch?week=${weekStart}`);
    };

    return (
        <DataContext.Provider value={{ fetchTimetableDay, fetchTimetableWeek }}>
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
