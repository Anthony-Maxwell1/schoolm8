import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import { parseICalData } from "@/lib/ical";
import { FetchTimetableDay, ObtainAuthCredentials } from "@/lib/edumateClient";

import { isValidISODate, standardiseDay, standardiseWeek } from "@/lib/timetableNormaliser";
import {
    getTimetableConfig,
    saveTimetableConfig,
    saveTimetableDay,
    getTimetableDay,
} from "@/lib/firebaseSchema";

// ======================================================
// CONFIG
// ======================================================

const CACHE_DURATION_MS = 1000 * 60 * 60 * 1; // 1 hour

// ======================================================
// HELPERS
// ======================================================

function resolveMode(params: URLSearchParams) {
    const dayParam = params.get("day");
    const weekParam = params.get("week");
    console.log("[resolveMode] dayParam:", dayParam, "weekParam:", weekParam);

    if (!dayParam && !weekParam) {
        console.log("[resolveMode] No params, defaulting to today");
        return { mode: "today" as const, value: "today" };
    }

    if (dayParam) {
        if (dayParam !== "today" && !isValidISODate(dayParam)) {
            throw new Error("Invalid day format. Use YYYY-MM-DD or 'today'");
        }
        console.log("[resolveMode] Day mode:", dayParam);
        return { mode: "day" as const, value: dayParam };
    }

    if (weekParam) {
        if (!isValidISODate(weekParam)) {
            throw new Error("Invalid week format. Use YYYY-MM-DD");
        }
        console.log("[resolveMode] Week mode:", weekParam);
        return { mode: "week" as const, value: weekParam };
    }

    return { mode: "today" as const, value: "today" };
}

function isCacheValid(entry?: any) {
    const valid = entry && entry.expiry && Date.now() < entry.expiry;
    console.log("[isCacheValid]", valid);
    return valid;
}

function resolveDate(value: string) {
    const resolved = value === "today" ? new Date().toISOString().split("T")[0] : value;
    console.log("[resolveDate] value:", value, "resolved:", resolved);
    return resolved;
}

// ======================================================
// ROUTE
// ======================================================

export async function GET(req: NextRequest) {
    try {
        console.log("[GET] Request started");

        // ---------- AUTH ----------
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            console.log("[GET] Missing Authorization header");
            return NextResponse.json(
                { error: "Missing or invalid Authorization header" },
                { status: 401 },
            );
        }

        const idToken = authHeader.split(" ")[1];
        const decodedToken = await auth.verifyIdToken(idToken);
        const userId = decodedToken.uid;
        console.log("[GET] User authenticated:", userId);

        // Get timetable config from new structure
        const timetableFetchData = await getTimetableConfig(userId);
        if (!timetableFetchData) {
            console.log("[GET] No timetable data found");
            return NextResponse.json({ timetable: null });
        }

        // ---------- MODE ----------
        const url = new URL(req.url);
        const { mode, value } = resolveMode(url.searchParams);
        console.log("[GET] Resolved mode:", mode, "value:", value);

        // ======================================================
        // ICAL PROVIDER
        // ======================================================
        if (timetableFetchData.type === "ical") {
            console.log("[GET] Using iCal provider");
            const { url: icalUrl, username, password } = timetableFetchData;

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
            console.log("[GET] Parsed iCal events:", parsedEvents.length);

            // ---- TODAY / DAY ----
            if (mode === "today" || mode === "day") {
                const date = resolveDate(value);

                // 🔍 CACHE CHECK
                const cached = await getTimetableDay(userId, date);
                if (isCacheValid(cached)) {
                    console.log("[GET] Returning cached day");
                    return NextResponse.json({ timetable: cached, cached: true });
                }

                // ❌ FETCH
                console.log("[GET] Fetching fresh day for date:", date);
                const timetable = await standardiseDay({
                    provider: "ical",
                    parsedICalEvents: parsedEvents,
                    date,
                });

                // 💾 CACHE
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

            // ---- WEEK ----
            if (mode === "week") {
                console.log("[GET] Fetching week starting:", value);
                const startDate = value;
                const days: string[] = [];

                // build 7-day range
                for (let i = 0; i < 7; i++) {
                    const d = new Date(startDate);
                    d.setDate(d.getDate() + i);
                    days.push(d.toISOString().split("T")[0]);
                }
                console.log("[GET] Days to fetch:", days);

                const results: Record<string, any> = {};

                for (const date of days) {
                    const cached = await getTimetableDay(userId, date);

                    if (isCacheValid(cached)) {
                        console.log("[GET] Using cached data for:", date);
                        results[date] = cached;
                        continue;
                    }

                    console.log("[GET] Fetching fresh data for date:", date);
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

        // ======================================================
        // EDUMATE PROVIDER
        // ======================================================
        if (timetableFetchData.type === "edumate") {
            console.log("[GET] Using Edumate provider");
            const { baseUrl, username, password, currentCookies } = timetableFetchData;

            if (!baseUrl || !username || !password) {
                console.log("[GET] Missing Edumate credentials");
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

            // ---- AUTH COOKIES ----
            let cookies = currentCookies;
            if (!cookies) {
                console.log("[GET] Obtaining new auth cookies");
                cookies = await ObtainAuthCredentials(baseUrl, username, password);
                if (!cookies) throw new Error("Failed to authenticate with Edumate");
                await saveTimetableConfig(userId, {
                    ...timetableFetchData,
                    currentCookies: cookies,
                });
            }

            // ---- TODAY / DAY ----
            if (mode === "today" || mode === "day") {
                const date = resolveDate(value);

                // 🔍 CACHE CHECK
                const cached = await getTimetableDay(userId, date);
                if (isCacheValid(cached)) {
                    console.log("[GET] Returning cached Edumate day");
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

                // ❌ FETCH
                console.log("[GET] Fetching fresh Edumate day for date:", date);
                const rawDay = await FetchTimetableDay(
                    cookies,
                    baseUrl,
                    mode === "today" ? "today" : date,
                );

                if (rawDay.error) {
                    console.log("[GET] Edumate error:", rawDay.error);
                    if (rawDay.error == 401) {
                        console.log("[GET] Re-authenticating due to 401");
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

                // 💾 CACHE + COOKIES
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

            // ---- WEEK ----
            if (mode === "week") {
                console.log("[GET] Fetching Edumate week starting:", value);
                const startDate = value;
                const results: Record<string, any> = {};

                for (let i = 0; i < 7; i++) {
                    const d = new Date(startDate);
                    d.setDate(d.getDate() + i);
                    const date = d.toISOString().split("T")[0];

                    const cached = await getTimetableDay(userId, date);

                    if (isCacheValid(cached)) {
                        console.log("[GET] Using cached Edumate data for:", date);
                        results[date] = cached;
                        continue;
                    }

                    console.log("[GET] Fetching fresh Edumate data for date:", date);
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

        console.log("[GET] No timetable provider found");
        return NextResponse.json({ timetable: null });
    } catch (err) {
        console.error("[GET] Error:", err);
        const executionId = req.nextUrl.searchParams.get("taskId");
        if (executionId) {
            try {
                const authHeader = req.headers.get("Authorization")!;

                const idToken = authHeader.split(" ")[1];
                const decodedToken = await auth.verifyIdToken(idToken);
                const userId = decodedToken.uid;
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
