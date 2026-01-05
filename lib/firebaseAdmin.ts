import admin from "firebase-admin";

let app;

if (!admin.apps.length) {
    const serviceAccount = require("@/serviceAccountKey.json");

    app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
} else {
    app = admin.app();
}

export const db = admin.firestore();
export const auth = admin.auth();
