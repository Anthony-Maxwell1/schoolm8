
import { NextRequest, NextResponse } from "next/server";
import { deleteThemeData, getOwnerTheme } from "@/lib/firebaseSchema";

import { getUid } from "@/lib/access/auth";
export async function POST(req: NextRequest) {
    try {
        const userId = getUid(req);

        const { themeId } = await req.json();
        if ((await getOwnerTheme(themeId)) !== userId) {
            return NextResponse.json(
                { error: "Unauthorized to delete this theme" },
                { status: 403 },
            );
        }

        await deleteThemeData(themeId);
        return NextResponse.json({ message: "Theme deleted successfully" });
    } catch (error) {
        console.error("Error creating theme:", error);
        return NextResponse.json({ error: "Failed to create theme" }, { status: 500 });
    }
}
