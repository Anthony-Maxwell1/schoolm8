import { assertAccess } from "@/lib/access/serverAccessControl";
import { auth } from "@/lib/firebaseAdmin";
import { NextRequest, NextResponse } from "next/server";
import { sanitizeNameStrict, sanitizeHtmlRecursive } from "@/lib/sanitise";
import { getOwnerTheme, GetTheme, updateThemeData } from "@/lib/firebaseSchema";

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
        }

        const idToken = authHeader.split(" ")[1];
        const decodedToken = await auth.verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const accessResult = await assertAccess(userId, [
            "api/themes/*",
            "apiAccessLevel1",
            "UGCAccessPermitted",
        ]);

        if (accessResult.status !== 200) {
            return new Response(JSON.stringify({ error: accessResult.body!.error }), {
                status: accessResult.status,
            });
        }

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
