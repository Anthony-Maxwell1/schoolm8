import { NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import fetch from "node-fetch";

export async function POST(req: Request) {
    try {
        const { assignmentId, courseId, files, url, text } = await req.json();
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer "))
            return NextResponse.json(
                { error: "Missing or invalid Authorization header" },
                { status: 401 },
            );

        const idToken = authHeader.split(" ")[1];

        // Verify Firebase ID token
        const decodedToken = await auth.verifyIdToken(idToken);
        const userId = decodedToken.uid;
        const userRef = db.collection("users").doc(userId);
        const doc = await userRef.get();
        if (!doc.exists) throw new Error("User not found");
        if (!doc.exists) throw new Error("User not found");

        const userData = doc.data();
        const canvasToken = userData?.canvasToken;
        const canvasBaseUrl = userData?.info?.canvasBaseUrl;
        if (!canvasToken || !canvasBaseUrl) throw new Error("Missing Canvas token or base URL");

        if (!assignmentId || !courseId) {
            return NextResponse.json(
                { error: "Missing assignmentId or courseId" },
                { status: 400 },
            );
        }

        if (!files && !url && !text) {
            return NextResponse.json(
                { error: "At least one of files, url, or text must be provided" },
                { status: 400 },
            );
        }

        const res = await fetch(
            `${canvasBaseUrl}/api/v1/courses/${courseId}/assignments/${assignmentId}/submissions`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${canvasToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    submission: {
                        submission_type: files
                            ? "online_upload"
                            : url
                              ? "online_url"
                              : "online_text_entry",
                        file_ids: files,
                        url: url,
                        body: text,
                    },
                }),
            },
        );

        if (!res.ok) {
            throw new Error(`Canvas API error: ${res.statusText}`);
        }

        const submissionResult = await res.json();
        return NextResponse.json(submissionResult);
    } catch (error) {
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
