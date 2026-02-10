import { getTokens } from "@/lib/googleClient";
import { redirect } from "next/navigation";
import { db } from "@/lib/firebaseAdmin";

export async function GET(req: Request) {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!state) return new Response("State is required", { status: 400 });

    const userId = state.split(".")[0];
    if (!userId) return new Response("Invalid state", { status: 400 });

    const userRef = db.collection("users").doc(userId);
    const doc = await userRef.get();
    if (!doc.exists) throw new Error("User not found");

    if (!doc.data()?.currentState || doc.data()?.currentState?.state !== state) {
        return new Response("Invalid state", { status: 400 });
    }

    if (!code) return new Response("Missing code", { status: 400 });

    const scopeGroup = doc.data()?.currentState?.data?.scopeGroup;
    if (!scopeGroup) return new Response("Missing scope group", { status: 400 });

    const redirectUrl = doc.data()?.currentState?.data?.redirectUrl ?? "/dashboard";

    try {
        const response = await getTokens(code);

        await userRef.set(
            {
                google: {
                    [scopeGroup]: {
                        token: response.tokens,
                        connectedAt: new Date(),
                    },
                },
                currentState: null,
            },
            { merge: true },
        );
    } catch (err) {
        console.error("Error getting tokens:", err);
        return new Response("OAuth failed", { status: 500 });
    }
    redirect(redirectUrl);
}
