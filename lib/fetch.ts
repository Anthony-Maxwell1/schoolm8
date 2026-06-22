// fetch.ts
import { getToken } from "./authStore";

export default async function fetch(...args: Parameters<typeof globalThis.fetch>) {
    const token = await getToken(5000);

    const headers = new Headers(args[1]?.headers);

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await globalThis.fetch(args[0], {
        ...args[1],
        headers,
    });

    if (!response.ok) {
        throw new Error(`Fetch error: ${response.status} ${response.statusText}`);
    }

    return response.json();
}
