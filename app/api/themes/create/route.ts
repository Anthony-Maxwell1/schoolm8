import { auth } from "@/lib/firebaseAdmin";
import { NextRequest, NextResponse } from "next/server";
import { sanitizeNameStrict, sanitizeHtmlRecursive } from "@/lib/sanitise";
import { postTheme } from "@/lib/firebaseSchema";

import { getUid } from "@/lib/access/auth";
export async function POST(req: NextRequest) {
    try {
        const userId = getUid(req);

        const { name, data, type } = await req.json();
        console.log(data);
        const sanitizedData = sanitizeHtmlRecursive(data);
        console.log(sanitizedData);
        const sanitizedName = sanitizeNameStrict(name).slice(0, 20);

        const userRecord = await auth.getUser(userId);

        const ownerName = userRecord.displayName || "Unknown User";

        const themeData = {
            data: sanitizedData,
            created: new Date(),
            name: sanitizedName,
            installs: 0,
            owner: userId,
            type,
            ownerName,
        };

        const id = await postTheme(themeData);

        return NextResponse.json({
            nameGotSanitized: sanitizedName != name,
            dataGotSanitized: sanitizedData != data,
            name: sanitizedName,
            id,
        });
    } catch (error) {
        console.error("Error creating theme:", error);
        return NextResponse.json({ error: "Failed to create theme" }, { status: 500 });
    }
}
