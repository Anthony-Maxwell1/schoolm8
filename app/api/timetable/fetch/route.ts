import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { parseICalData } from "@/lib/ical";
import { FetchTimetableDay, ObtainAuthCredentials } from "@/lib/edumateClient";

import { getWeekDates, isValidISODate, standardiseDay } from "@/lib/timetableNormaliser";
import {
    getTimetableConfig,
    saveTimetableConfig,
    saveTimetableDay,
    getTimetableDay,
} from "@/lib/firebaseSchema";

import { getUid } from "@/lib/access/auth";

const CACHE_DURATION_MS = 1000 * 60 * 60 * 1; // 1 hour

function resolveMode(params: URLSearchParams) {
    const dayParam = params.get("day");
    const weekParam = params.get("week");

    if (!dayParam && !weekParam) {
        return { mode: "today" as const, value: "today" };
    }

    if (dayParam) {
        if (dayParam !== "today" && !isValidISODate(dayParam)) {
            throw new Error("Invalid day format. Use YYYY-MM-DD or 'today'");
        }
        return { mode: "day" as const, value: dayParam };
    }

    if (weekParam) {
        if (!isValidISODate(weekParam)) {
            throw new Error("Invalid week format. Use YYYY-MM-DD");
        }
        return { mode: "week" as const, value: weekParam };
    }

    return { mode: "today" as const, value: "today" };
}

function isCacheValid(entry?: any) {
    const valid = entry && entry.expiry && Date.now() < entry.expiry;
    return valid;
}

function resolveDate(value: string) {
    const resolved = value === "today" ? new Date().toISOString().split("T")[0] : value;
    return resolved;
}

export async function GET(req: NextRequest) {
    try {
        const userId = getUid(req);

        const timetableFetchData = await getTimetableConfig(userId);
        if (!timetableFetchData) {
            const executionId = req.nextUrl.searchParams.get("taskId");
            if (executionId) {
                try {
                    const userRef = db.collection("users").doc(userId);
                    await userRef.update({
                        [`executions.${executionId}.status`]: "failed",
                    });
                } catch (updateErr) {
                    console.error("Failed to update task status:", updateErr);
                }
            }
            return NextResponse.json({ timetable: null }, { status: 404 });
        }

        const url = new URL(req.url);
        const { mode, value } = resolveMode(url.searchParams);

        if (timetableFetchData.type === "ical") {
            const { url: icalUrl, username, password } = timetableFetchData;

            if (mode === "day") {
                const date = resolveDate(value);
                const cached = await getTimetableDay(userId, date);
                if (isCacheValid(cached)) {
                    return NextResponse.json({ timetable: cached, cached: true });
                }
            }

            const result = await fetch(icalUrl, {
                method: "GET",
                headers: {
                    Authorization: `Basic ${btoa(`${username}:${password}`)}`,
                },
            });

            if (!result.ok) {
                throw new Error("Failed to fetch iCal timetable");
            }

            const icalText = await result.text();
            const parsedEvents = parseICalData(icalText);

            if (mode === "today" || mode === "day") {
                const date = resolveDate(value);

                const cached = await getTimetableDay(userId, date);
                if (isCacheValid(cached)) {
                    return NextResponse.json({ timetable: cached, cached: true });
                }

                const timetable = await standardiseDay({
                    provider: "ical",
                    parsedICalEvents: parsedEvents,
                    date,
                });

                await saveTimetableDay(userId, date, timetable, CACHE_DURATION_MS);

                const executionId = req.nextUrl.searchParams.get("taskId");
                if (executionId) {
                    try {
                        const userRef = db.collection("users").doc(userId);
                        await userRef.update({
                            [`executions.${executionId}.status`]: "complete",
                        });
                    } catch (updateErr) {
                        console.error("Failed to update task status:", updateErr);
                    }
                }

                return NextResponse.json({ timetable, cached: false });
            }

            if (mode === "week") {
                const days = getWeekDates(value);

                const results: Record<string, any> = {};

                for (const date of days) {
                    const cached = await getTimetableDay(userId, date);

                    if (isCacheValid(cached)) {
                        results[date] = cached;
                        continue;
                    }

                    const timetable = await standardiseDay({
                        provider: "ical",
                        parsedICalEvents: parsedEvents,
                        date,
                    });

                    await saveTimetableDay(userId, date, timetable, CACHE_DURATION_MS);
                    results[date] = timetable;
                }

                const executionId = req.nextUrl.searchParams.get("taskId");
                if (executionId) {
                    try {
                        const userRef = db.collection("users").doc(userId);
                        await userRef.update({
                            [`executions.${executionId}.status`]: "complete",
                        });
                    } catch (updateErr) {
                        console.error("Failed to update task status:", updateErr);
                    }
                }

                return NextResponse.json({ timetable: results });
            }
        }

        if (timetableFetchData.type === "edumate") {
            const { baseUrl, username, password, currentCookies } = timetableFetchData;

            if (!baseUrl || !username || !password) {
                const executionId = req.nextUrl.searchParams.get("taskId");
                if (executionId) {
                    try {
                        const userRef = db.collection("users").doc(userId);
                        await userRef.update({
                            [`executions.${executionId}.status`]: "failed",
                        });
                    } catch (updateErr) {
                        console.error("Failed to update task status:", updateErr);
                    }
                }
                return NextResponse.json(
                    { error: "Missing baseUrl, username or password" },
                    { status: 400 },
                );
            }

            let cookies = currentCookies;
            if (!cookies) {
                cookies = await ObtainAuthCredentials(baseUrl, username, password);
                if (!cookies) throw new Error("Failed to authenticate with Edumate");
                await saveTimetableConfig(userId, {
                    ...timetableFetchData,
                    currentCookies: cookies,
                });
            }

            if (mode === "today" || mode === "day") {
                const date = resolveDate(value);

                const cached = await getTimetableDay(userId, date);
                if (isCacheValid(cached)) {
                    const executionId = req.nextUrl.searchParams.get("taskId");
                    if (executionId) {
                        try {
                            const userRef = db.collection("users").doc(userId);
                            await userRef.update({
                                [`executions.${executionId}.status`]: "complete",
                            });
                        } catch (updateErr) {
                            console.error("Failed to update task status:", updateErr);
                        }
                    }
                    return NextResponse.json({ timetable: cached, cached: true });
                }

                const rawDay = await FetchTimetableDay(
                    cookies,
                    baseUrl,
                    mode === "today" ? "today" : date,
                );

                if (rawDay.error) {
                    if (rawDay.error == 401) {
                        cookies = await ObtainAuthCredentials(baseUrl, username, password);
                        if (!cookies) throw new Error("Failed to authenticate with Edumate");
                        await saveTimetableConfig(userId, {
                            ...timetableFetchData,
                            currentCookies: cookies,
                        });
                    } else {
                        throw new Error();
                    }
                }

                const timetable = await standardiseDay({
                    provider: "edumate",
                    rawDay,
                    date,
                });

                await saveTimetableConfig(userId, {
                    ...timetableFetchData,
                    currentCookies: cookies,
                });

                await saveTimetableDay(userId, date, timetable, CACHE_DURATION_MS);

                const executionId = req.nextUrl.searchParams.get("taskId");
                if (executionId) {
                    try {
                        const userRef = db.collection("users").doc(userId);
                        await userRef.update({
                            [`executions.${executionId}.status`]: "complete",
                        });
                    } catch (updateErr) {
                        console.error("Failed to update task status:", updateErr);
                    }
                }

                return NextResponse.json({ timetable, cached: false });
            }

            if (mode === "week") {
                const results: Record<string, any> = {};

                for (const date of getWeekDates(value)) {
                    const cached = await getTimetableDay(userId, date);

                    if (isCacheValid(cached)) {
                        results[date] = cached;
                        continue;
                    }

                    const rawDay = await FetchTimetableDay(cookies, baseUrl, date);

                    const timetable = await standardiseDay({
                        provider: "edumate",
                        rawDay,
                        date,
                    });

                    await saveTimetableDay(userId, date, timetable, CACHE_DURATION_MS);
                    results[date] = timetable;
                }

                await saveTimetableConfig(userId, {
                    ...timetableFetchData,
                    currentCookies: cookies,
                });

                const executionId = req.nextUrl.searchParams.get("taskId");
                if (executionId) {
                    try {
                        const userRef = db.collection("users").doc(userId);
                        await userRef.update({
                            [`executions.${executionId}.status`]: "complete",
                        });
                    } catch (updateErr) {
                        console.error("Failed to update task status:", updateErr);
                    }
                }

                return NextResponse.json({ timetable: results });
            }
        }

        const executionId = req.nextUrl.searchParams.get("taskId");
        if (executionId) {
            try {
                const userRef = db.collection("users").doc(userId);
                await userRef.update({
                    [`executions.${executionId}.status`]: "failed",
                });
            } catch (updateErr) {
                console.error("Failed to update task status:", updateErr);
            }
        }
        return NextResponse.json({ timetable: null });
    } catch (err) {
        const executionId = req.nextUrl.searchParams.get("taskId");
        if (executionId) {
            try {
                const userId = getUid(req);
                const userRef = db.collection("users").doc(userId);
                await userRef.update({
                    [`executions.${executionId}.status`]: "failed",
                });
            } catch (updateErr) {
                console.error("Failed to update task status:", updateErr);
            }
        }
        return new Response(
            JSON.stringify({
                error: err instanceof Error ? err.message : "Internal Server Error",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
        );
    }
}
