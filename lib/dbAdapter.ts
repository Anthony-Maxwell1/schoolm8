/**
 * DbAdapter interface + factories for Admin and Client SDKs.
 *
 * Your firebaseAdmin.ts and firebaseClient.ts each export a `db` that satisfies
 * this interface. schema.ts imports from "./db" (a path alias) which resolves to
 * whichever one the current build target needs.
 *
 * The interface mirrors the Admin SDK's chaining style, since that's what
 * schema.ts already uses — the client adapter wraps the modular SDK to match it.
 */

/* =====================================================
   INTERFACE  (what schema.ts calls on `db`)
===================================================== */

export interface DbDocSnapshot {
    id: string;
    exists: boolean;
    data(): Record<string, any> | undefined;
    ref: DbDocRef;
}

export interface DbQuerySnapshot {
    docs: DbDocSnapshot[];
    forEach(cb: (doc: DbDocSnapshot) => void): void;
}

export interface DbDocRef {
    set(data: Record<string, any>, options?: { merge?: boolean }): Promise<void>;
    update(data: Record<string, any>): Promise<void>;
    delete(): Promise<void>;
    get(): Promise<DbDocSnapshot>;
    collection(path: string): DbCollectionRef;
}

type WhereOp = "==" | "<" | "<=" | ">" | ">=" | "!=" | "array-contains";

export interface DbQueryRef {
    get(): Promise<DbQuerySnapshot>;
    where(field: string, op: WhereOp, value: unknown): DbQueryRef;
    orderBy(field: string, dir?: "asc" | "desc"): DbQueryRef;
    limit(n: number): DbQueryRef;
}

export interface DbCollectionRef extends DbQueryRef {
    doc(id: string): DbDocRef;
    add(data: Record<string, any>): Promise<{ id: string }>;
}

export interface DbWriteBatch {
    set(ref: DbDocRef, data: Record<string, any>, options?: { merge?: boolean }): this;
    delete(ref: DbDocRef): this;
    commit(): Promise<void>;
}

/** The shape that schema.ts expects `db` to have. */
export interface Db {
    collection(path: string): DbCollectionRef;
    batch(): DbWriteBatch;
}

/* =====================================================
   ADMIN SDK ADAPTER
===================================================== */

/**
 * Call this in firebaseAdmin.ts and export the result as `db`:
 *
 *   import * as firebaseAdmin from "firebase-admin";
 *   import { createAdminDb } from "./dbAdapter";
 *   export const db = createAdminDb(firebaseAdmin.firestore());
 */
export function createAdminDb(adminDb: FirebaseFirestore.Firestore): Db {
    function wrapDocRef(ref: FirebaseFirestore.DocumentReference): DbDocRef {
        return {
            set: (data, opts) => ref.set(data, opts ?? {}) as unknown as Promise<void>,
            update: (data) => ref.update(data) as unknown as Promise<void>,
            delete: () => ref.delete() as unknown as Promise<void>,
            get: async () => wrapDocSnap(await ref.get()),
            collection: (path) => wrapCollectionRef(ref.collection(path)),
            _raw: ref,
        } as DbDocRef & { _raw: FirebaseFirestore.DocumentReference };
    }

    function wrapDocSnap(snap: FirebaseFirestore.DocumentSnapshot): DbDocSnapshot {
        return {
            id: snap.id,
            exists: snap.exists,
            data: () => snap.data() as Record<string, any> | undefined,
            ref: wrapDocRef(snap.ref),
        };
    }

    function wrapQuerySnap(snap: FirebaseFirestore.QuerySnapshot): DbQuerySnapshot {
        const docs = snap.docs.map(wrapDocSnap);
        return { docs, forEach: (cb) => docs.forEach(cb) };
    }

    function wrapQuery(q: FirebaseFirestore.Query): DbQueryRef {
        return {
            get: async () => wrapQuerySnap(await q.get()),
            where: (f, op, v) => wrapQuery(q.where(f, op as FirebaseFirestore.WhereFilterOp, v)),
            orderBy: (f, d) => wrapQuery(q.orderBy(f, d)),
            limit: (n) => wrapQuery(q.limit(n)),
        };
    }

    function wrapCollectionRef(ref: FirebaseFirestore.CollectionReference): DbCollectionRef {
        return {
            doc: (id) => wrapDocRef(ref.doc(id)),
            get: async () => wrapQuerySnap(await ref.get()),
            where: (f, op, v) => wrapQuery(ref.where(f, op as FirebaseFirestore.WhereFilterOp, v)),
            orderBy: (f, d) => wrapQuery(ref.orderBy(f, d)),
            limit: (n) => wrapQuery(ref.limit(n)),
            add: async (data) => ({ id: (await ref.add(data)).id }),
        };
    }

    return {
        collection: (path) => wrapCollectionRef(adminDb.collection(path)),
        batch: () => {
            const b = adminDb.batch();
            const batch: DbWriteBatch = {
                set: (ref, data, opts) => {
                    b.set((ref as any)._raw, data, opts ?? {});
                    return batch;
                },
                delete: (ref) => {
                    b.delete((ref as any)._raw);
                    return batch;
                },
                commit: () => b.commit() as unknown as Promise<void>,
            };
            return batch;
        },
    };
}

/* =====================================================
   CLIENT SDK ADAPTER
===================================================== */

/**
 * Call this in firebaseClient.ts and export the result as `db`:
 *
 *   import { getFirestore } from "firebase/firestore";
 *   import { createClientDb } from "./dbAdapter";
 *   export const db = createClientDb(getFirestore());
 */
export function createClientDb(clientDb: import("firebase/firestore").Firestore): Db {
    type FS = typeof import("firebase/firestore");
    // Pre-load synchronously where possible; all async paths await fs().
    let _fs: FS | null = null;
    const fs = (): Promise<FS> =>
        _fs ? Promise.resolve(_fs) : import("firebase/firestore").then((m) => (_fs = m));

    // Kick off the load immediately so .doc() calls inside batch() work sync.
    import("firebase/firestore").then((m) => {
        _fs = m;
    });

    type FsDocRef = import("firebase/firestore").DocumentReference;
    type FsColRef = import("firebase/firestore").CollectionReference;
    type FsQuery = import("firebase/firestore").Query;
    type FsSnap = import("firebase/firestore").QuerySnapshot;

    function wrapDocSnap(snap: import("firebase/firestore").DocumentSnapshot): DbDocSnapshot {
        return {
            id: snap.id,
            exists: snap.exists(),
            data: () => snap.data() as Record<string, any> | undefined,
            ref: wrapDocRef(snap.ref),
        };
    }

    function wrapQuerySnap(snap: FsSnap): DbQuerySnapshot {
        const docs = snap.docs.map((d) => ({
            id: d.id,
            exists: d.exists(),
            data: () => d.data() as Record<string, any>,
            ref: wrapDocRef(d.ref),
        }));
        return { docs, forEach: (cb) => docs.forEach(cb) };
    }

    type Constraint =
        | { type: "where"; f: string; op: WhereOp; v: unknown }
        | { type: "orderBy"; f: string; d?: "asc" | "desc" }
        | { type: "limit"; n: number };

    function applyConstraints(base: FsQuery, constraints: Constraint[]): Promise<FsQuery> {
        return fs().then(({ query, where, orderBy, limit }) => {
            const built = constraints.map((c) => {
                if (c.type === "where") return where(c.f, c.op as any, c.v);
                if (c.type === "orderBy") return orderBy(c.f, c.d);
                return limit(c.n);
            });
            return query(base, ...built);
        });
    }

    function wrapQuery(base: FsQuery, constraints: Constraint[] = []): DbQueryRef {
        return {
            get: async () => {
                const { getDocs } = await fs();
                return wrapQuerySnap(await getDocs(await applyConstraints(base, constraints)));
            },
            where: (f, op, v) => wrapQuery(base, [...constraints, { type: "where", f, op, v }]),
            orderBy: (f, d) => wrapQuery(base, [...constraints, { type: "orderBy", f, d }]),
            limit: (n) => wrapQuery(base, [...constraints, { type: "limit", n }]),
        };
    }

    function wrapDocRef(ref: FsDocRef): DbDocRef {
        return {
            set: async (data, opts) => {
                const { setDoc } = await fs();
                await setDoc(ref, data, opts ?? {});
            },
            update: async (data) => {
                const { updateDoc } = await fs();
                await updateDoc(ref, data);
            },
            delete: async () => {
                const { deleteDoc } = await fs();
                await deleteDoc(ref);
            },
            get: async () => {
                const { getDoc } = await fs();
                return wrapDocSnap(await getDoc(ref));
            },
            collection: (path) => {
                // _fs is guaranteed loaded by the time any .collection() chaining happens
                // because all entry-points (collection() on db) are async-started.
                const { collection } = _fs!;
                return wrapCollectionRef(collection(ref, path) as FsColRef);
            },
            _raw: ref,
        } as DbDocRef & { _raw: FsDocRef };
    }

    function wrapCollectionRef(ref: FsColRef): DbCollectionRef {
        return {
            doc: (id) => {
                const { doc } = _fs!;
                return wrapDocRef(doc(ref, id));
            },
            get: async () => {
                const { getDocs } = await fs();
                return wrapQuerySnap(await getDocs(ref));
            },
            where: (f, op, v) => wrapQuery(ref, [{ type: "where", f, op, v }]),
            orderBy: (f, d) => wrapQuery(ref, [{ type: "orderBy", f, d }]),
            limit: (n) => wrapQuery(ref, [{ type: "limit", n }]),
            add: async (data) => {
                const { addDoc } = await fs();
                return { id: (await addDoc(ref, data)).id };
            },
        };
    }

    return {
        collection: (path) => {
            const { collection } =
                _fs ??
                (() => {
                    throw new Error("firebase/firestore not loaded yet");
                })();
            return wrapCollectionRef(collection(clientDb, path) as FsColRef);
        },
        batch: () => {
            const { writeBatch } = _fs!;
            const b = writeBatch(clientDb);
            const batch: DbWriteBatch = {
                set: (ref, data, opts) => {
                    b.set((ref as any)._raw, data, opts ?? {});
                    return batch;
                },
                delete: (ref) => {
                    b.delete((ref as any)._raw);
                    return batch;
                },
                commit: () => b.commit(),
            };
            return batch;
        },
    };
}
