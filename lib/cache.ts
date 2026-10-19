import { LRUCache } from "lru-cache";

export const cache = new LRUCache<string, {}>({
    max: 1000,
    ttl: 15_000,
});

const inflight = new Map<string, Promise<unknown>>();

export async function cached<T extends {}>(
    key: string,
    fn: () => Promise<T>,
    options?: {
        ttl?: number;
        inflight?: boolean;
    },
): Promise<T> {
    const cachedValue = cache.get(key);
    if (cachedValue !== undefined) {
        return cachedValue as T;
    }

    if (options?.inflight) {
        const existing = inflight.get(key);
        if (existing) {
            return existing as Promise<T>;
        }
    }

    const promise = fn()
        .then((value) => {
            if (options?.ttl !== 0) {
                cache.set(key, value, { ttl: options?.ttl });
            }
            return value;
        })
        .finally(() => {
            inflight.delete(key);
        });

    if (options?.inflight) {
        inflight.set(key, promise);
    }

    return promise as Promise<T>;
}
