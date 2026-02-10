// POST /api/canvas/upload

import { auth, db } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";
import { Readable } from "stream";
import { FormData, File } from "formdata-node";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
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

        const userData = doc.data();
        const canvasToken = userData?.canvasToken;
        const canvasBaseUrl = userData?.info?.canvasBaseUrl;
        if (!canvasToken || !canvasBaseUrl) throw new Error("Missing Canvas token or base URL");

        const body = await req.json();
        const { name, size, contentType, onedrive, assignmentId } = body;

        if (!name || !size || !contentType) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        console.log(`Canvas upload: ${name} (${size} bytes)`);

        // 1️⃣ Begin upload with Canvas
        const begin = await fetch(`${canvasBaseUrl}/api/v1/users/self/files`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${canvasToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name,
                size,
                content_type: contentType,
                parent_folder_path: assignmentId ? `assignments/${assignmentId}` : undefined,
            }),
        });

        if (!begin.ok) {
            const errorText = await begin.text();
            throw new Error(`Canvas begin upload failed: ${errorText}`);
        }

        const beginData = await begin.json();
        console.log("Canvas upload session created");

        if (!onedrive) {
            return NextResponse.json({
                uploadUrl: beginData.upload_url,
                uploadParams: beginData.upload_params,
                fileMetadata: beginData,
            });
        }

        const onedriveToken = userData?.onedrive?.token?.access_token;
        if (!onedriveToken) throw new Error("Missing OneDrive access token");

        // 2️⃣ Get OneDrive download URL
        console.log("Fetching OneDrive file metadata");
        const fileMeta = await fetch(
            `https://graph.microsoft.com/v1.0/me/drive/items/${onedrive}?select=@microsoft.graph.downloadUrl`,
            {
                headers: { Authorization: `Bearer ${onedriveToken}` },
            },
        );

        if (!fileMeta.ok) throw new Error("Failed to fetch OneDrive metadata");

        const { "@microsoft.graph.downloadUrl": downloadUrl } = await fileMeta.json();
        if (!downloadUrl) throw new Error("No download URL from OneDrive");

        // 3️⃣ Stream file from OneDrive
        console.log("Streaming file from OneDrive");
        const fileStream = await fetch(downloadUrl);
        if (!fileStream.ok || !fileStream.body) throw new Error("Failed to fetch file stream");

        // 4️⃣ Build multipart form data with streaming
        const form = new FormData();

        // Add Canvas upload params
        for (const key in beginData.upload_params) {
            const value = beginData.upload_params[key];
            if (value !== undefined && value !== null) {
                form.set(key, value.toString());
            }
        }

        // Convert Web ReadableStream to Node.js Readable stream
        const webStream = fileStream.body;
        const reader = webStream.getReader();

        const nodeStream = new Readable({
            async read() {
                try {
                    const { done, value } = await reader.read();
                    if (done) {
                        this.push(null);
                    } else {
                        this.push(Buffer.from(value));
                    }
                } catch (err) {
                    this.destroy(err as Error);
                }
            },
        });

        // Create a File object from the stream
        // formdata-node's File constructor: new File([content], filename, options)
        const file = new File([nodeStream as any], name, {
            type: contentType,
            size: size,
        });

        form.set("file", file);

        // 5️⃣ Upload to Canvas (streaming)
        console.log("Uploading to Canvas (streaming)");
        const uploadResult = await fetch(beginData.upload_url, {
            method: "POST",
            body: form as any,
            // @ts-ignore
            duplex: "half",
        });

        if (!uploadResult.ok) {
            const errorText = await uploadResult.text();
            console.error("Canvas upload failed:", errorText);
            throw new Error(`Canvas upload failed: ${errorText}`);
        }

        const uploadData = await uploadResult.json();
        console.log("Upload complete!");

        return NextResponse.json({
            uploaded: true,
            fileId: uploadData.id,
            fileInfo: uploadData,
        });
    } catch (err: any) {
        console.error("Canvas upload error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
