import type { Db } from "./dbAdapter";

let db: Db;

if (typeof window === "undefined") {
    const { db: adminDb } = require("./firebaseAdmin");
    const { createAdminDb } = require("./dbAdapter");
    db = createAdminDb(adminDb);
} else {
    const { db: clientDb } = require("./firebaseClient");
    const { createClientDb } = require("./dbAdapter");
    db = createClientDb(clientDb);
}

export { db };
