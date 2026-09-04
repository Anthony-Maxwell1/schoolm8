import { LRUCache } from "lru-cache";

export const cache = new LRUCache({
    max: 500,
});

const inflight = new Map<string, Promise<Record<string, unknown>>>();

export async function cached(
    key: string,
    fn: () => Promise<Record<string, unknown>>,
    options?: {
        ttl?: number;
        inflight?: boolean;
    },
): Promise<Record<string, unknown>> {
    const cached = cache.get(key);
    if (cached !== undefined) {
        return cached;
    }

    if (options?.inflight) {
        const existing = inflight.get(key);
        if (existing) {
            return existing;
        }
    }

    const promise = fn()
        .then((value) => {
            cache.set(key, value);
            return value;
        })
        .finally(() => {
            inflight.delete(key);
        });

    if (options?.inflight) {
        inflight.set(key, promise);
    }

    return promise;
}
