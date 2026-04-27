import { source } from "@/lib/source";
import { createFromSource } from "fumadocs-core/search/server";
import { auth } from "@/lib/firebaseAdmin";
import { assertAccess } from "@/lib/access/serverAccessControl";

const { GET: searchGET } = createFromSource(source, {
    // https://docs.orama.com/docs/orama-js/supported-languages
    language: "english",
});

export async function GET(req: Request) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Missing or invalid Authorization header" }), {
            status: 401,
        });
    }

    const idToken = authHeader.split(" ")[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const accessResult = await assertAccess(userId, ["api/search/*", "apiAccessLevel-1"]);
    if (accessResult.status !== 200) {
        return new Response(JSON.stringify({ error: accessResult.body!.error }), {
            status: accessResult.status,
        });
    }

    return searchGET(req);
}
