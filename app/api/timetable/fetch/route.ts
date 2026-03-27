import { NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import { parseICalData } from "@/lib/ical";
import { FetchTimetableDay, ObtainAuthCredentials } from "@/lib/edumateClient";

import { isValidISODate, standardiseDay, standardiseWeek } from "@/lib/timetableNormaliser";

// ======================================================
// CONFIG
// ======================================================

const CACHE_DURATION_MS = 1000 * 60 * 60 * 6; // 6 hours

// ======================================================
// HELPERS
// ======================================================

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

function isCacheValid(entry?: { expiry: number }) {
    return entry && Date.now() < entry.expiry;
}

async function getCachedDay(userRef: any, date: string) {
    const doc = await userRef.get();
    const cache = doc.data()?.timetable?.cache || {};
    return cache[date];
}

async function setCachedDay(userRef: any, date: string, data: any) {
    const expiry = Date.now() + CACHE_DURATION_MS;

    await userRef.set(
        {
            timetable: {
                cache: {
                    [date]: {
                        data,
                        expiry,
                    },
                },
            },
        },
        { merge: true },
    );
}

function resolveDate(value: string) {
    return value === "today" ? new Date().toISOString().split("T")[0] : value;
}

// ======================================================
// ROUTE
// ======================================================

export async function GET(req: Request) {
    try {
        // ---------- AUTH ----------
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json(
                { error: "Missing or invalid Authorization header" },
                { status: 401 },
            );
        }

        const idToken = authHeader.split(" ")[1];
        const decodedToken = await auth.verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const userRef = db.collection("users").doc(userId);
        const doc = await userRef.get();
        if (!doc.exists) throw new Error("User not found");

        const timetableFetchData = doc.data()?.timetable;
        if (!timetableFetchData) {
            return NextResponse.json({ timetable: null });
        }

        // ---------- MODE ----------
        const url = new URL(req.url);
        const { mode, value } = resolveMode(url.searchParams);

        // ======================================================
        // ICAL PROVIDER
        // ======================================================
        if (timetableFetchData.type === "ical") {
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

            // ---- TODAY / DAY ----
            if (mode === "today" || mode === "day") {
                const date = resolveDate(value);

                // 🔍 CACHE CHECK
                const cached = await getCachedDay(userRef, date);
                if (isCacheValid(cached)) {
                    return NextResponse.json({ timetable: cached.data, cached: true });
                }

                // ❌ FETCH
                const timetable = await standardiseDay({
                    provider: "ical",
                    parsedICalEvents: parsedEvents,
                    date,
                });

                // 💾 CACHE
                await setCachedDay(userRef, date, timetable);

                return NextResponse.json({ timetable, cached: false });
            }

            // ---- WEEK ----
            if (mode === "week") {
                const startDate = value;
                const days: string[] = [];

                // build 7-day range
                for (let i = 0; i < 7; i++) {
                    const d = new Date(startDate);
                    d.setDate(d.getDate() + i);
                    days.push(d.toISOString().split("T")[0]);
                }

                const results: Record<string, any> = {};

                for (const date of days) {
                    const cached = await getCachedDay(userRef, date);

                    if (isCacheValid(cached)) {
                        results[date] = cached.data;
                        continue;
                    }

                    const timetable = await standardiseDay({
                        provider: "ical",
                        parsedICalEvents: parsedEvents,
                        date,
                    });

                    await setCachedDay(userRef, date, timetable);
                    results[date] = timetable;
                }

                return NextResponse.json({ timetable: results });
            }
        }

        // ======================================================
        // EDUMATE PROVIDER
        // ======================================================
        if (timetableFetchData.type === "edumate") {
            const { baseUrl, username, password, currentCookies } = timetableFetchData;

            if (!baseUrl || !username || !password) {
                return NextResponse.json(
                    { error: "Missing baseUrl, username or password" },
                    { status: 400 },
                );
            }

            // ---- AUTH COOKIES ----
            let cookies = currentCookies;
            if (!cookies) {
                cookies = await ObtainAuthCredentials(baseUrl, username, password);
                if (!cookies) throw new Error("Failed to authenticate with Edumate");
            }

            // ---- TODAY / DAY ----
            if (mode === "today" || mode === "day") {
                const date = resolveDate(value);

                // 🔍 CACHE CHECK
                const cached = await getCachedDay(userRef, date);
                if (isCacheValid(cached)) {
                    return NextResponse.json({ timetable: cached.data, cached: true });
                }

                // ❌ FETCH
                const rawDay = await FetchTimetableDay(
                    cookies,
                    baseUrl,
                    mode === "today" ? "today" : date,
                );

                const timetable = await standardiseDay({
                    provider: "edumate",
                    rawDay,
                    date,
                });

                // 💾 CACHE + COOKIES
                await userRef.set(
                    {
                        timetable: {
                            currentCookies: cookies,
                        },
                    },
                    { merge: true },
                );

                await setCachedDay(userRef, date, timetable);

                return NextResponse.json({ timetable, cached: false });
            }

            // ---- WEEK ----
            if (mode === "week") {
                const startDate = value;
                const results: Record<string, any> = {};

                for (let i = 0; i < 7; i++) {
                    const d = new Date(startDate);
                    d.setDate(d.getDate() + i);
                    const date = d.toISOString().split("T")[0];

                    const cached = await getCachedDay(userRef, date);

                    if (isCacheValid(cached)) {
                        results[date] = cached.data;
                        continue;
                    }

                    const rawDay = await FetchTimetableDay(cookies, baseUrl, date);

                    const timetable = await standardiseDay({
                        provider: "edumate",
                        rawDay,
                        date,
                    });

                    await setCachedDay(userRef, date, timetable);
                    results[date] = timetable;
                }

                await userRef.set(
                    {
                        timetable: {
                            currentCookies: cookies,
                        },
                    },
                    { merge: true },
                );

                return NextResponse.json({ timetable: results });
            }
        }

        return NextResponse.json({ timetable: null });
    } catch (err) {
        console.error(err);
        return new Response(
            JSON.stringify({
                error: err instanceof Error ? err.message : "Internal Server Error",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
        );
    }
}
