export async function POST(req: Request) {
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

    const { url, username, password } = await req.json();
    if (!url || !username || !password) {
      return NextResponse.json({ error: "Missing url, username or password" }, { status: 400 });
    }
    const result = await fetch(url, {
      method = "GET",
      headers = {
        'Authorization': `Basic ${btoa(`{username}:{password}`)}`
      }
    })
    if (!result.ok) {
      const error = result.json()
      throw new Error(`Verification failed: {error}`)
    }
    await userRef.set(
      {
        ical: {
          url,
          username,
          password
        },
      },
      { merge: true },
    );
    return NextResponse.json({ message: "Canvas connected successfully" });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}