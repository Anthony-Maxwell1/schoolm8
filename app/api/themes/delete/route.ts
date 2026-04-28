import { assertAccess } from "@/lib/access/serverAccessControl";
import { auth } from "@/lib/firebaseAdmin";
import { NextRequest, NextResponse } from "next/server";
import { deleteThemeData, getOwnerTheme } from "@/lib/firebaseSchema";

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
