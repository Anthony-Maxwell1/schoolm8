"use client";

import { useEffect, useMemo, useState } from "react";

export const ClockTile = () => {
    const [now, setNow] = useState<Date | null>(null);

    useEffect(() => {
        setNow(new Date());
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    const timeText = useMemo(
        () =>
            now?.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            }) ?? "--:--:--",
        [now],
    );

    const dateText = useMemo(
        () =>
            now?.toLocaleDateString([], {
                weekday: "short",
                month: "short",
                day: "numeric",
            }) ?? "",
        [now],
    );

    const second = now?.getSeconds() ?? 0;
    const minute = (now?.getMinutes() ?? 0) + second / 60;
    const hour = ((now?.getHours() ?? 0) % 12) + minute / 60;

    const secondDeg = second * 6;
    const minuteDeg = minute * 6;
    const hourDeg = hour * 30;

    return (
        <div className="w-full h-full rounded-xl bg-slate-900 text-center flex items-center justify-center flex-col">
            <p className="text-sm font-medium text-emerald-100">{dateText}</p>

            <p className="font-mono text-4xl font-bold tracking-wider text-emerald-300 tabular-nums">
                {timeText}
            </p>
        </div>
    );
};
