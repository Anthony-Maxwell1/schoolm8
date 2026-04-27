import { generateAuthUrl, ScopeCategory } from "@/lib/googleClient";
import { redirect } from "next/navigation";
import { db } from "@/lib/firebaseAdmin";
import { assertAccess } from "@/lib/access/ServerAccessControl";

export async function GET(req: Request) {
    const url = new URL(req.url);
    const state = url.searchParams.get("state");
    if (!state) {
        return new Response("State is required", { status: 400 });
    }
    const userId = state.split(".")[0];
    if (!userId) {
        return new Response("Invalid state", { status: 400 });
    }
    const accessResult = await assertAccess(userId, ["api/auth/google/*", "apiAccessLevel1"]);

    if (accessResult.status !== 200) {
        return new Response(JSON.stringify({ error: accessResult.body!.error }), {
            status: accessResult.status,
        });
    }

    const userRef = db.collection("users").doc(userId);
    const doc = await userRef.get();
    if (!doc.exists) throw new Error("User not found");

    if (!doc.data()?.currentState || doc.data()?.currentState?.state !== state) {
        return new Response("Invalid state", { status: 400 });
    }
    const scopeCategory = url.searchParams.get("scope");

    if (!scopeCategory) {
        return new Response("Scope category is required", { status: 400 });
    }

    const redirectUrl = generateAuthUrl(scopeCategory as ScopeCategory, state);

    if (!redirectUrl) {
        return new Response("An error occurred", { status: 500 });
    }

    return redirect(redirectUrl);
}
