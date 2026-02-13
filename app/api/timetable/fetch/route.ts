import { NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import { parseICalData } from "@/lib/ical";
import { FetchTimetableDay, ObtainAuthCredentials } from "@/lib/edumateClient";

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer "))
            return NextResponse.json(
                { error: "Missing or invalid Authorization header" },
                { status: 401 },
            );

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

        const url = new URL(req.url);

        let day = url.searchParams.get("day");

        if (!day) {
            day = "today";
        }

        if (timetableFetchData.type === "ical") {
            const { url, username, password } = timetableFetchData;
            const result = await fetch(url, {
                method: "GET",
                headers: {
                    Authorization: `Basic ${btoa(`${username}:${password}`)}`,
                },
            });
            if (!result.ok) {
                const error = await result.json();
                throw new Error(`Failed to fetch timetable: ${error}`);
            }
            const timetableData = await result.text(); // Assuming the iCal data is returned as text
            const parsedTimetable = parseICalData(timetableData);
            return NextResponse.json({ timetable: parsedTimetable });
        } else if (timetableFetchData.type === "edumate") {
            const { baseUrl, username, password, currentCookies } = timetableFetchData;
            if (!baseUrl || !username || !password) {
                return NextResponse.json(
                    { error: "Missing baseUrl, username or password in stored timetable data" },
                    { status: 400 },
                );
            }
            if (currentCookies) {
                try {
                    const timetableData = await FetchTimetableDay(currentCookies, baseUrl, day);
                    if (timetableData && typeof timetableData === "object")
                        await userRef.set(
                            {
                                timetable: {
                                    lastFetchedTimetable: timetableData,
                                },
                            },
                            { merge: true },
                        );
                    return NextResponse.json({ timetable: timetableData });
                } catch (err) {
                    console.warn(
                        "Failed to fetch timetable with stored cookies, attempting re-authentication:",
                        err,
                    );
                }
            } else {
                console.warn(
                    "No stored cookies found for Edumate timetable, attempting re-authentication",
                );
                try {
                    const authCredentials = await ObtainAuthCredentials(
                        baseUrl,
                        username,
                        password,
                    );
                    if (!authCredentials || authCredentials == "") {
                        throw new Error(`Verification failed`);
                    }
                    const timetableData = await FetchTimetableDay(authCredentials, baseUrl, day);
                    if (timetableData && typeof timetableData === "object") {
                        await userRef.set(
                            {
                                timetable: {
                                    currentCookies: authCredentials,
                                    lastFetchedTimetable: timetableData,
                                },
                            },
                            { merge: true },
                        );
                        return NextResponse.json({ timetable: timetableData });
                    } else {
                        throw new Error("Failed to fetch timetable after re-authentication");
                    }
                } catch {
                    throw new Error("Failed to re-authenticate and fetch timetable");
                }
            }
        }
    } catch (err) {
        console.error(err);
        return new Response(
            JSON.stringify({ error: err instanceof Error ? err.message : "Internal Server Error" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
        );
    }
}
