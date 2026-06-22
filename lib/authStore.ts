// authStore.ts
let token: string | null = null;
let loading = true;

export function setAuthState(newToken: string | null, isLoading: boolean) {
    token = newToken;
    loading = isLoading;
}

export async function getToken(timeoutMs = 5000) {
    const start = Date.now();

    while (loading) {
        if (Date.now() - start > timeoutMs) {
            throw new Error("Auth timed out");
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return token;
}
