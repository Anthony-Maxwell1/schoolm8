import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import fetch from "./fetch";
import { crypto } from "./crypto";
import { urls } from "./urls";
import { timetableNormaliser } from "./timetableNormaliser";
import { lmsNormaliser } from "./lmsNormaliser";
import { sanitise } from "./sanitise";
import { ical } from "./ical";
import { getToken, setAuthState } from "./authStore";
import { schema as firebaseSchema } from "./firebaseSchema";
import { db, auth } from "./firebaseClient";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default {
    crypto,
    urls,
    net: {
        fetch,
    },
    timetable: {
        timetableNormaliser,
        ical,
    },
    sanitise,
    lms: {
        lmsNormaliser,
    },
    auth: {
        getToken,
        setAuthState,
    },
    firebase: {
        schema: firebaseSchema,
        client: {
            db,
            auth,
        },
    },
};
