import { NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import { parseICalData } from "@/lib/ical";
import { FetchTimetableDay, ObtainAuthCredentials } from "@/lib/edumateClient";

import { isValidISODate, standardiseDay, standardiseWeek } from "@/lib/timetableNormaliser";

// --- helpers ---
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

// --- route ---
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
                const date = value === "today" ? new Date().toISOString().split("T")[0] : value;

                const timetable = await standardiseDay({
                    provider: "ical",
                    parsedICalEvents: parsedEvents,
                    date,
                });

                return NextResponse.json({ timetable });
            }

            // ---- WEEK ----
            if (mode === "week") {
                // group parsed events by YYYY-MM-DD
                const grouped: Record<string, any[]> = {};

                for (const event of parsedEvents) {
                    const date = event.startDate.toISOString().split("T")[0];
                    if (!grouped[date]) grouped[date] = [];
                    grouped[date].push(event);
                }

                const timetable = await standardiseWeek({
                    provider: "ical",
                    startDate: value,
                    icalEventsByDay: grouped,
                });

                return NextResponse.json({ timetable });
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
                const dayValue = mode === "today" ? "today" : value;

                const rawDay = await FetchTimetableDay(cookies, baseUrl, dayValue);

                const timetable = await standardiseDay({
                    provider: "edumate",
                    rawDay,
                    date: dayValue === "today" ? new Date().toISOString().split("T")[0] : dayValue,
                });

                await userRef.set(
                    {
                        timetable: {
                            currentCookies: cookies,
                            lastFetchedTimetable: timetable,
                        },
                    },
                    { merge: true },
                );

                return NextResponse.json({ timetable });
            }

            // ---- WEEK ----
            if (mode === "week") {
                const timetable = await standardiseWeek({
                    provider: "edumate",
                    startDate: value,
                    fetchEdumateDay: (date) => FetchTimetableDay(cookies, baseUrl, date),
                });

                await userRef.set(
                    {
                        timetable: {
                            currentCookies: cookies,
                            lastFetchedTimetable: timetable,
                        },
                    },
                    { merge: true },
                );

                return NextResponse.json({ timetable });
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
