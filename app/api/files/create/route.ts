// POST /api/files/create

import { NextResponse } from "next/server";
import { db, auth } from "@/lib/firebaseAdmin";

export const maxDuration = 300; // 5 minutes
export const dynamic = "force-dynamic";

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks

export async function POST(req: Request) {
    try {
        const path = req.headers.get("X-File-Path");
        const contentType = req.headers.get("Content-Type") || "application/octet-stream";
        const fileSizeHeader = req.headers.get("Content-Length");
        const fileSize = fileSizeHeader ? parseInt(fileSizeHeader) : 0;

        console.log(`Upload request: path=${path}, size=${fileSize}, type=${contentType}`);

        if (!path || !req.body) {
            return NextResponse.json({ error: "Missing file body or path" }, { status: 400 });
        }

        // Auth
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
        }

        const idToken = authHeader.split(" ")[1];
        const decoded = await auth.verifyIdToken(idToken);
        const uid = decoded.uid;

        const userRef = db.collection("users").doc(uid);
        const doc = await userRef.get();
        const accessToken = doc.data()?.onedrive?.token?.access_token;
        if (!accessToken) throw new Error("User not connected to OneDrive");

        // For small files (< 4MB), use simple upload
        // Note: Using 4MB threshold as per Microsoft docs
        if (fileSize > 0 && fileSize < 4 * 1024 * 1024) {
            console.log("Using simple upload for small file");
            const uploadUrl = `https://graph.microsoft.com/v1.0/me/drive/root:${path}:/content`;

            const response = await fetch(uploadUrl, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": contentType,
                },
                body: req.body,
                // @ts-ignore
                duplex: "half",
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Upload failed:", errorText);
                return NextResponse.json(
                    { error: `Upload failed: ${errorText}` },
                    { status: response.status },
                );
            }

            const data = await response.json();
            return NextResponse.json(data);
        }

        // For large files, use upload session with chunking
        console.log("Using chunked upload for large file");
        const sessionUrl = `https://graph.microsoft.com/v1.0/me/drive/root:${path}:/createUploadSession`;
        const sessionResponse = await fetch(sessionUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                item: {
                    "@microsoft.graph.conflictBehavior": "rename",
                },
            }),
        });

        if (!sessionResponse.ok) {
            const error = await sessionResponse.text();
            console.error("Failed to create upload session:", error);
            throw new Error(`Failed to create upload session: ${error}`);
        }

        const { uploadUrl } = await sessionResponse.json();
        console.log("Upload session created");

        // Read and upload in chunks
        const reader = req.body.getReader();
        let bytesUploaded = 0;
        let buffer = new Uint8Array(0);
        let chunkCount = 0;

        while (true) {
            const { done, value } = await reader.read();

            if (value) {
                const newBuffer = new Uint8Array(buffer.length + value.length);
                newBuffer.set(buffer);
                newBuffer.set(value, buffer.length);
                buffer = newBuffer;
            }

            const shouldUpload = buffer.length >= CHUNK_SIZE || (done && buffer.length > 0);

            if (shouldUpload) {
                const chunkSize = Math.min(buffer.length, CHUNK_SIZE);
                const chunk = buffer.slice(0, chunkSize);

                const endByte = bytesUploaded + chunk.length - 1;
                const totalSize = fileSize || (done ? bytesUploaded + chunk.length : "*");

                chunkCount++;
                console.log(
                    `Uploading chunk ${chunkCount}: bytes ${bytesUploaded}-${endByte}/${totalSize}`,
                );

                const chunkResponse = await fetch(uploadUrl, {
                    method: "PUT",
                    headers: {
                        "Content-Length": chunk.length.toString(),
                        "Content-Range": `bytes ${bytesUploaded}-${endByte}/${totalSize}`,
                    },
                    body: chunk,
                });

                console.log(`Chunk ${chunkCount} response: ${chunkResponse.status}`);

                if (!chunkResponse.ok && chunkResponse.status !== 202) {
                    const errorText = await chunkResponse.text();
                    console.error(`Chunk upload failed:`, errorText);
                    throw new Error(`Chunk upload failed: ${errorText}`);
                }

                bytesUploaded += chunk.length;
                buffer = buffer.slice(chunkSize);

                // Last chunk returns the file metadata
                if (chunkResponse.status === 201 || chunkResponse.status === 200) {
                    const data = await chunkResponse.json();
                    console.log("Upload complete!");
                    return NextResponse.json(data);
                }
            }

            if (done) break;
        }

        console.log(`Upload finished: ${bytesUploaded} bytes uploaded`);
        return NextResponse.json({ success: true, bytesUploaded });
    } catch (err: any) {
        console.error("Upload error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
