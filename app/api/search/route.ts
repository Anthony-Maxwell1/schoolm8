import { source } from "@/lib/source";
import { createFromSource } from "fumadocs-core/search/server";


import { getUid } from "@/lib/access/auth";
const { GET: searchGET } = createFromSource(source, {
    // https://docs.orama.com/docs/orama-js/supported-languages
    language: "english",
});

export async function GET(req: Request) {
    const userId = getUid(req);

    return searchGET(req);
}
