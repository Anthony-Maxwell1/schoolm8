
import { NextRequest, NextResponse } from "next/server";
import { sanitizeNameStrict, sanitizeHtmlRecursive } from "@/lib/sanitise";
import { getOwnerTheme, GetTheme, updateThemeData } from "@/lib/firebaseSchema";

import { getUid } from "@/lib/access/auth";
export async function POST(req: NextRequest) {
    try {
        const userId = getUid(req);

        const { themeId, name, data } = await req.json();
        if ((await getOwnerTheme(themeId)) !== userId) {
            return NextResponse.json(
                { error: "Unauthorized to update this theme" },
                { status: 403 },
            );
        }
        const sanitizedData = sanitizeHtmlRecursive(data);
        const sanitizedName = sanitizeNameStrict(name).slice(0, 20);

        const themeData = {
            ...(await GetTheme(themeId)),
            data: sanitizedData,
            name: sanitizedName,
            updated: new Date(),
        };

        await updateThemeData(themeId, themeData);

        return NextResponse.json({
            nameGotSanitized: sanitizedName != name,
            dataGotSanitized: sanitizedData != data,
            name: sanitizedName,
        });
    } catch (error) {
        console.error("Error creating theme:", error);
        return NextResponse.json({ error: "Failed to create theme" }, { status: 500 });
    }
}
