import * as Sentry from "@sentry/nextjs";
import { auth } from "@/lib/firebaseAdmin";
import { assertAccess } from "@/lib/access/ServerAccessControl";
export const dynamic = "force-dynamic";

class SentryExampleAPIError extends Error {
    constructor(message: string | undefined) {
        super(message);
        this.name = "SentryExampleAPIError";
    }
}

// A faulty API route to test Sentry's error monitoring
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

    const accessResult = await assertAccess(userId, ["api/sentry-example-api", "apiAccessLevel2"]);
    if (accessResult.status !== 200) {
        return new Response(JSON.stringify({ error: accessResult.body!.error }), {
            status: accessResult.status,
        });
    }

    Sentry.logger.info("Sentry example API called");
    throw new SentryExampleAPIError(
        "This error is raised on the backend called by the example page.",
    );
}
