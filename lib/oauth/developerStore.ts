import { randomBytes } from "crypto";
import { db } from "@/lib/firebaseAdmin";

export type DeveloperApp = {
    appId: string;
    ownerUid: string;
    name: string;
    logoUrl?: string;
    createdAt: FirebaseFirestore.Timestamp | Date;
};

export async function isDeveloper(uid: string): Promise<boolean> {
    const snap = await db.collection("developerAccounts").doc(uid).get();
    return snap.exists && snap.data()?.enabled === true;
}

export async function enableDeveloper(uid: string): Promise<void> {
    await db.collection("developerAccounts").doc(uid).set({ uid, enabled: true, updatedAt: new Date() }, { merge: true });
}

export async function listDeveloperApps(ownerUid: string): Promise<DeveloperApp[]> {
    const snap = await db.collection("oauthApps").where("ownerUid", "==", ownerUid).get();
    return snap.docs.map((doc) => doc.data() as DeveloperApp);
}

export async function getDeveloperApp(appId: string, ownerUid: string): Promise<DeveloperApp | null> {
    const snap = await db.collection("oauthApps").doc(appId).get();
    if (!snap.exists || snap.data()?.ownerUid !== ownerUid) return null;
    return snap.data() as DeveloperApp;
}

export async function createDeveloperApp(params: { ownerUid: string; name: string; logoUrl?: string }): Promise<DeveloperApp> {
    let app: DeveloperApp = { appId: randomBytes(12).toString("hex"), ownerUid: params.ownerUid, name: params.name, createdAt: new Date() };
    if (params.logoUrl) app.logoUrl = params.logoUrl;
    await db.collection("oauthApps").doc(app.appId).set(app);
    return app;
}

export async function updateDeveloperApp(appId: string, ownerUid: string, updates: { name?: string; logoUrl?: string }): Promise<DeveloperApp | null> {
    const app = await getDeveloperApp(appId, ownerUid);
    if (!app) return null;
    await db.collection("oauthApps").doc(appId).update(updates);
    return { ...app, ...updates };
}

export async function deleteDeveloperApp(appId: string, ownerUid: string): Promise<boolean> {
    const app = await getDeveloperApp(appId, ownerUid);
    if (!app) return false;
    const clients = await db.collection("oauthClients").where("ownerUid", "==", ownerUid).get();
    await Promise.all(clients.docs.filter((doc) => doc.data()?.appId === appId).map((doc) => doc.ref.delete()));
    await db.collection("oauthApps").doc(appId).delete();
    return true;
}