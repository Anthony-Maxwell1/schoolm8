import { redirect } from "next/navigation";
import { db } from "@/lib/firebaseAdmin";

export default async function GET(req: Request) {
    const url = new URL(req.url);
    const state = url.searchParams.get("state");
    if (!state) {
        return new Response("State is required", { status: 400 });
    }
    const userId = state.split(".")[0];
    if (!userId) {
        return new Response("Invalid state", { status: 400 });
    }
    const userRef = db.collection("users").doc(userId);
    const doc = await userRef.get();
    if (!doc.exists) throw new Error("User not found");

    if (!doc.data()?.currentState || doc.data()?.currentState?.state !== state) {
        return new Response("Invalid state", { status: 400 });
    }

    const clientId = process.env.NEXT_PUBLIC_AZURE_CLIENT_ID;
    const redirectUri = encodeURIComponent(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/onedrive/callback`,
    );
    const scope = encodeURIComponent("Files.ReadWrite offline_access User.Read");
    const responseType = "code";
    const responseMode = "query";

    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=${responseType}&redirect_uri=${redirectUri}&response_mode=${responseMode}&scope=${scope}&state=${state}`;
    redirect(authUrl);
}
