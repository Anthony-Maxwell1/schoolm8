/**
 * Merge cookies from old and new set-cookie headers
 */
function mergeCookies(oldCookies: string, newCookies: string | null): string {
    const cookieMap: Record<string, string> = {};

    // parse old cookies
    oldCookies?.split(/; ?/).forEach((c) => {
        const [k, v] = c.split("=");
        if (k && v) cookieMap[k.trim()] = v.trim();
    });

    // parse new cookies from set-cookie headers
    newCookies?.split(/,(?=\s*[A-Za-z0-9_\-]+=)/).forEach((c) => {
        const [k, v] = c.split(";")[0].split("=");
        if (k && v) cookieMap[k.trim()] = v.trim();
    });

    return Object.entries(cookieMap)
        .map(([k, v]) => `${k}=${v}`)
        .join("; ");
}

/**
 * Fetch with manual redirect, returns response, merged cookies, next location
 */
async function fetchWithRedirect(url: string, cookies: string) {
    const res = await fetch(url, {
        headers: {
            cookie: cookies,
        },
        redirect: "manual",
    });

    const mergedCookies = mergeCookies(cookies, res.headers.get("set-cookie"));
    const nextLocation = res.headers.get("location");

    return { res, mergedCookies, location: nextLocation };
}

/**
 * Login flow, auto-follow redirects until fully authenticated
 */
export async function ObtainAuthCredentials(
    BASE_DOMAIN: string,
    USERNAME: string,
    PASSWORD: string,
) {
    // STEP 1 — load login page
    const loginPageRes = await fetch(`https://${BASE_DOMAIN}/norwest/web/app.php/login/`);
    const loginHtml = await loginPageRes.text();

    const tokenHtml = loginHtml.match(/tokenHtml"\s*:\s*"([^"]+)"/)?.[1];
    if (!tokenHtml) throw new Error("CSRF token not found");

    let authCookies = mergeCookies("", loginPageRes.headers.get("set-cookie"));

    // STEP 2 — POST login credentials
    const loginBody = new URLSearchParams({
        _username: USERNAME,
        _password: PASSWORD,
        recaptchaResponse: "",
        hasRecaptcha: "false",
        _csrf_token: tokenHtml,
        _target_path: "login-pass",
        return_path: "dashboard/my-edumate/#failed",
        da: "0",
    });

    let loginRes = await fetch(`https://${BASE_DOMAIN}/norwest/web/app.php/login-check`, {
        method: "POST",
        headers: {
            "content-type": "application/x-www-form-urlencoded",
            cookie: authCookies,
        },
        body: loginBody.toString(),
        redirect: "manual",
    });

    authCookies = mergeCookies(authCookies, loginRes.headers.get("set-cookie"));
    let location = loginRes.headers.get("location");
    console.log("Step 1 -> login-check:", loginRes.status, location);

    // STEP 3+ — follow all redirects until dashboard
    while (location) {
        const url = location.startsWith("http")
            ? location
            : location.startsWith("/")
              ? `https://${BASE_DOMAIN}${location}`
              : `https://${BASE_DOMAIN}/norwest/web/app.php/${location}`;

        const { res, mergedCookies, location: nextLoc } = await fetchWithRedirect(url, authCookies);

        console.log(`Redirect -> ${res.status} ${nextLoc || "final page"}`);
        authCookies = mergedCookies;
        location = nextLoc;

        // Last page
        if (!location) {
            const finalHtml = await res.text();
            console.log("✅ Final dashboard HTML length:", finalHtml.length);
            break;
        }
    }

    console.log("✅ Fully authenticated cookies:", authCookies);
    return authCookies; // ready to use for any future requests
}

export async function FetchTimetable(authCookies: string) {
    const res = await fetch(
        "https://norwest.edumate.net/norwest/web/app.php/admin/get-day-calendar/today/current?page=1&start=0&limit=25",
        {
            headers: {
                cookie: authCookies,
            },
            method: "GET",
        },
    );
    const data = await res.json();
    console.log("Timetable data:", data);
    return data;
}
