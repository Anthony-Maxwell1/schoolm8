import { NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer "))
      return NextResponse.json(
        { error: "Missing or invalid Authorization header" },
        { status: 401 },
      );

    const idToken = authHeader.split(" ")[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;
    const userRef = db.collection("users").doc(userId);
    const doc = await userRef.get();
    if (!doc.exists) throw new Error("User not found");

    const userData = doc.data();
    const canvasToken = userData?.canvasToken;
    const canvasBaseUrl = userData?.info?.canvasBaseUrl;

    if (canvasToken && canvasBaseUrl) {
      // Verify Canvas token
      const verifyRes = await fetch(`${canvasBaseUrl}/api/v1/users/self`, {
        headers: {
          Authorization: `Bearer ${canvasToken}`,
        },
      });

      if (verifyRes.ok) {
        return NextResponse.json({ connected: true });
      }
    }
    return NextResponse.json({ connected: false });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}
