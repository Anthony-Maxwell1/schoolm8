import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const count = parseInt(searchParams.get("count") || "20", 10) || 20;
        const filter = searchParams.get("filter");
        const filterOnly = String(searchParams.get("filterOnly")) === "true";
        const query = searchParams.get("query");
        const filterdata = searchParams.get("filterdata");

        // Start building Firestore query
        let queryRef: any = db.collection("themes");

        // If not filterOnly and a text query was provided, add name range query
        if (!filterOnly && query) {
            queryRef = queryRef.where("name", ">=", query).where("name", "<=", query + "\uf8ff");
        }

        // Handle special filters: popular, new, recentUpdated
        if (filter === "popular") {
            // order by "install" desc
            queryRef = queryRef.orderBy("install", "desc").limit(count);
        } else if (filter === "new") {
            queryRef = queryRef.orderBy("created", "desc").limit(count);
        } else if (filter === "recentUpdated") {
            queryRef = queryRef.orderBy("updated", "desc").limit(count);
        } else if (filter === "type") {
            // filterdata contains the type value
            if (filterdata) queryRef = queryRef.where("type", "==", filterdata).limit(count);
            else queryRef = queryRef.limit(count);
        } else if (filter) {
            // generic filter name with filterdata value
            if (filterdata) queryRef = queryRef.where(filter, "==", filterdata).limit(count);
            else queryRef = queryRef.limit(count);
        }

        // Any other search params (excluding the known ones) should be applied as equality filters
        const ignored = new Set(["count", "filter", "filterOnly", "query", "filterdata"]);
        for (const [key, value] of searchParams.entries()) {
            if (ignored.has(key)) continue;
            // If we've already applied this param via filter/filterdata, skip
            if (key === filter) continue;
            // Apply equality filter; Firestore supports chaining where clauses
            if (value) queryRef = queryRef.where(key, "==", value);
        }

        // If no explicit ordering was applied above, apply a reasonable default and limit
        // (orderBy required for cursor-based pagination; here we just limit)
        if (!queryRef._queryOptions || !queryRef._queryOptions.parent) {
            // best-effort: just limit
            queryRef = queryRef.limit(count);
        }

        const snapshot = await queryRef.get();
        const result = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

        return NextResponse.json(result);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Error fetching themes." }, { status: 500 });
    }
}
