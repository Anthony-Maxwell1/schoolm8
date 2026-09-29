/**
 * Firebase Firestore schema helpers for LMS and Timetable collections
 *
 * New Structure:
 * users/{userId}/
 * lms/{userId}/courses/{courseId}
 * lms/{userId}/assignments/{assignmentId}
 * lms/{userId}/announcements/{announcementId}
 * timetable/{userId}/config
 * timetable/{userId}/days/{date}
 */

import { DocumentData, arrayUnion } from "firebase/firestore";
import { db } from "./db";
import { v4 as uuidv4 } from "uuid";

const isPlainObject = (value: unknown): value is Record<string, any> => {
    if (!value || typeof value !== "object") return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
};

const removeUndefinedDeep = <T>(value: T): T => {
    if (value === undefined) {
        return undefined as T;
    }

    if (Array.isArray(value)) {
        return value
            .map((item) => removeUndefinedDeep(item))
            .filter((item) => item !== undefined) as T;
    }

    if (isPlainObject(value)) {
        const cleaned: Record<string, any> = {};
        for (const [key, nestedValue] of Object.entries(value)) {
            const sanitized = removeUndefinedDeep(nestedValue);
            if (sanitized !== undefined) {
                cleaned[key] = sanitized;
            }
        }
        return cleaned as T;
    }

    return value;
};

/* =====================================================
   LMS SCHEMA HELPERS
===================================================== */

/**
 * Get reference to a user's LMS courses collection
 */
export const getLMSCoursesRef = (userId: string) =>
    db.collection("lms").doc(userId).collection("courses");

/**
 * Get reference to a user's LMS assignments collection
 */
export const getLMSAssignmentsRef = (userId: string) =>
    db.collection("lms").doc(userId).collection("assignments");

/**
 * Get reference to a user's LMS announcements collection
 */
export const getLMSAnnouncementsRef = (userId: string) =>
    db.collection("lms").doc(userId).collection("announcements");

/**
 * Save a single LMS course
 */
export const saveLMSCourse = async (
    userId: string,
    courseId: string,
    courseData: Record<string, any>,
) => {
    return getLMSCoursesRef(userId).doc(courseId).set(removeUndefinedDeep(courseData), {
        merge: true,
    });
};

/**
 * Save a single LMS assignment
 */
export const saveLMSAssignment = async (
    userId: string,
    assignmentId: string,
    assignmentData: Record<string, any>,
) => {
    return getLMSAssignmentsRef(userId)
        .doc(assignmentId)
        .set(removeUndefinedDeep(assignmentData), { merge: true });
};

/**
 * Save a single LMS announcement
 */
export const saveLMSAnnouncement = async (
    userId: string,
    announcementId: string,
    announcementData: Record<string, any>,
) => {
    return getLMSAnnouncementsRef(userId)
        .doc(announcementId)
        .set(removeUndefinedDeep(announcementData), {
            merge: true,
        });
};

/**
 * Bulk save LMS courses
 */
export const saveLMSCourses = async (userId: string, coursesMap: Record<string, any>) => {
    const batch = db.batch();
    const coursesRef = getLMSCoursesRef(userId);

    for (const [courseId, courseData] of Object.entries(coursesMap)) {
        batch.set(coursesRef.doc(courseId), removeUndefinedDeep(courseData), { merge: true });
    }

    return batch.commit();
};

/**
 * Bulk save LMS assignments
 */
export const saveLMSAssignments = async (userId: string, assignmentsMap: Record<string, any>) => {
    const batch = db.batch();
    const assignmentsRef = getLMSAssignmentsRef(userId);

    for (const [assignmentId, assignmentData] of Object.entries(assignmentsMap)) {
        batch.set(assignmentsRef.doc(assignmentId), removeUndefinedDeep(assignmentData), {
            merge: true,
        });
    }

    return batch.commit();
};

/**
 * Bulk save LMS announcements
 */
export const saveLMSAnnouncements = async (
    userId: string,
    announcementsMap: Record<string, any>,
) => {
    const batch = db.batch();
    const announcementsRef = getLMSAnnouncementsRef(userId);

    for (const [announcementId, announcementData] of Object.entries(announcementsMap)) {
        batch.set(announcementsRef.doc(announcementId), removeUndefinedDeep(announcementData), {
            merge: true,
        });
    }

    return batch.commit();
};

/**
 * Remove course docs that are no longer in `keepIds`. Used after a sync so that
 * last year's (now inactive) courses stop showing up. When `sourceType` is given,
 * only courses of that type are pruned (so e.g. a Canvas sync won't delete
 * Google Classroom courses).
 */
export const pruneLMSCourses = async (userId: string, keepIds: string[], sourceType?: string) => {
    const keep = new Set(keepIds);
    const snapshot = await getLMSCoursesRef(userId).get();
    const batch = db.batch();
    let deletions = 0;
    snapshot.forEach((doc) => {
        const data = doc.data();
        if (sourceType && data?.type !== sourceType) return;
        if (!keep.has(doc.id)) {
            batch.delete(doc.ref);
            deletions += 1;
        }
    });
    if (deletions > 0) await batch.commit();
    return deletions;
};

/**
 * Get a user's LMS courses
 */
export const getLMSCourses = async (userId: string) => {
    const snapshot = await getLMSCoursesRef(userId).get();
    const courses: Record<string, any> = {};
    snapshot.forEach((doc) => {
        courses[doc.id] = doc.data();
    });
    return courses;
};

/**
 * Get a user's LMS assignments
 */
export const getLMSAssignments = async (userId: string) => {
    const snapshot = await getLMSAssignmentsRef(userId).get();
    const assignments: Record<string, any> = {};
    snapshot.forEach((doc) => {
        assignments[doc.id] = doc.data();
    });
    return assignments;
};

export const getDueLMSAssignments = async (userId: string) => {
    const snapshot = await getLMSAssignmentsRef(userId).get();
    const assignments: any[] = [];
    const now = Date.now();

    snapshot.forEach((doc) => {
        const data = doc.data();

        if (data?.dueAt && new Date(data.dueAt).getTime() > now) {
            assignments.push({
                id: doc.id,
                ...data,
            });
        }
    });

    return assignments;
};

export const markCompletedOverride = async (
    userId: string,
    assignmentId: string,
    completed: boolean,
) => {
    const assignmentRef = getLMSAssignmentsRef(userId).doc(assignmentId);
    await assignmentRef.set(
        {
            finishedOverride: completed,
            overriddenFields: ["finishedOverride"],
        },
        { merge: true },
    );
    const updatedDoc = await assignmentRef.get();
    return updatedDoc.exists ? updatedDoc.data() : null;
};

/**
 * Get a user's LMS announcements
 */
export const getLMSAnnouncements = async (userId: string) => {
    const snapshot = await getLMSAnnouncementsRef(userId).get();
    const announcements: Record<string, any> = {};
    snapshot.forEach((doc) => {
        announcements[doc.id] = doc.data();
    });
    return announcements;
};

/* =====================================================
   TIMETABLE SCHEMA HELPERS
===================================================== */

/**
 * Get reference to a user's timetable config document
 */
export const getTimetableConfigRef = (userId: string) =>
    db.collection("timetable").doc(userId).collection("config").doc("default");

/**
 * Get reference to a user's timetable days collection
 */
export const getTimetableDaysRef = (userId: string) =>
    db.collection("timetable").doc(userId).collection("days");

/**
 * Save timetable configuration
 */
export const saveTimetableConfig = async (userId: string, configData: Record<string, any>) => {
    return getTimetableConfigRef(userId).set(removeUndefinedDeep(configData), { merge: true });
};

/**
 * Save a single timetable day with cache expiry
 */
export const saveTimetableDay = async (
    userId: string,
    date: string,
    dayData: Record<string, any>,
    cacheDurationMs: number = 3600000,
) => {
    const expiry = Date.now() + cacheDurationMs;

    return getTimetableDaysRef(userId)
        .doc(date)
        .set(
            removeUndefinedDeep({
                ...dayData,
                date,
                expiry,
            }),
            { merge: true },
        );
};

export const deleteThemesByUser = async (userId: string) => {
    const snapshot = await db.collection("themes").where("owner", "==", userId).get();
    const batch = db.batch();
    snapshot.forEach((doc) => {
        batch.delete(doc.ref);
    });
    return batch.commit();
};

export const deleteData = async (userId: string) => {
    try {
        await db.collection("lms").doc(userId).delete();
    } catch (error) {}
    try {
        await db.collection("timetable").doc(userId).delete();
    } catch (error) {}
    try {
        await deleteThemesByUser(userId);
    } catch (error) {}

    try {
        await db.collection("users").doc(userId).delete();
    } catch (error) {}
};

/**
 * Get timetable configuration
 */
export const getTimetableConfig = async (userId: string) => {
    const doc = await getTimetableConfigRef(userId).get();
    return doc.exists ? doc.data() : null;
};

/**
 * Get a single timetable day
 */
export const getTimetableDay = async (userId: string, date: string) => {
    const doc = await getTimetableDaysRef(userId).doc(date).get();
    if (!doc.exists) return null;

    const data = doc.data();
    // Check if cache is still valid
    if (data?.expiry && Date.now() > data.expiry) {
        return null; // Cache expired
    }

    return data;
};

/**
 * Get multiple timetable days
 */
export const getTimetableDays = async (userId: string, dates: string[]) => {
    const batch = db.batch();
    const docs = await Promise.all(
        dates.map((date) => getTimetableDaysRef(userId).doc(date).get()),
    );

    const days: Record<string, any> = {};
    docs.forEach((doc) => {
        if (doc.exists) {
            const data = doc.data();
            // Check if cache is still valid
            if (!data?.expiry || Date.now() <= data.expiry) {
                days[doc.id] = data;
            }
        }
    });

    return days;
};

/**
 * Delete old timetable cache entries (older than 7 days)
 */
export const cleanupOldTimetableCache = async (userId: string, daysToKeep: number = 7) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffTime = cutoffDate.getTime();

    const snapshot = await getTimetableDaysRef(userId).where("expiry", "<", cutoffTime).get();

    const batch = db.batch();
    snapshot.forEach((doc) => {
        batch.delete(doc.ref);
    });

    return batch.commit();
};

export const deleteTimetableCache = async (userId: string) => {
    const snapshot = await getTimetableDaysRef(userId).get();
    const batch = db.batch();
    snapshot.forEach((doc) => {
        batch.delete(doc.ref);
    });
    return batch.commit();
};

/**
 * UGC Themes
 */

export const GetTheme = async (themeId: string) => {
    const doc = await db.collection("themes").doc(themeId).get();
    return doc.exists ? doc.data() : null;
};

export const getTopThemes = async (key: string, count: number, order: "asc" | "desc" = "asc") => {
    const snapshot = await db.collection("themes").orderBy(key, order).limit(count).get();

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
};

export const filterThemes = async (key: string, value: string, count: number) => {
    const snapshot = await db.collection("themes").where(key, "==", value).limit(count).get();
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
};

export const searchThemes = async (
    query?: string,
    count: number = 10,
    order?: "asc" | "desc",
    filterKey?: string,
    filterValue?: string,
) => {
    let queryRef: any = db.collection("themes");
    if (query) {
        queryRef = queryRef
            .where("name", ">=", query)
            .where("name", "<=", query + "\uf8ff")
            .limit(count);
    }

    if (filterKey && filterValue) {
        queryRef = queryRef.where(filterKey, "==", filterValue);
    }

    if (order) {
        queryRef = queryRef.orderBy("name", order);
    }

    const snapshot = await queryRef.get();
    return snapshot.docs.map((doc: DocumentData) => ({
        id: doc.id,
        ...doc.data(),
    }));
};

export const postTheme = async (themeData: Record<string, any>) => {
    const docRef = await db.collection("themes").add(themeData);
    return { id: docRef.id, ...themeData };
};

export const updateThemeData = async (themeId: string, newData: Record<string, any>) => {
    const docRef = db.collection("themes").doc(themeId);
    await docRef.update(newData);
    return { id: themeId, ...newData };
};

export const getOwnerTheme = async (themeId: string) => {
    const doc = await db.collection("themes").doc(themeId).get();
    return doc.exists ? doc.data()?.owner : null;
};

export const deleteThemeData = async (themeId: string) => {
    const docRef = db.collection("themes").doc(themeId);
    await docRef.delete();
};

/**
 * Knowledge Base Schema
 */

export interface KnowledgeBasePage {
    id: string;
    title: string;
    content: string;
    children: KnowledgeBasePage[];
}

export interface KnowledgeBase {
    pages: KnowledgeBasePage[];
}

export const getKnowledgeBaseRef = (userId: string) => db.collection("knowledgeBases").doc(userId);

export const saveKnowledgeBase = async (userId: string, kbData: KnowledgeBase) => {
    return getKnowledgeBaseRef(userId).set(removeUndefinedDeep(kbData), { merge: true });
};

export const getKnowledgeBase = async (userId: string) => {
    const doc = await getKnowledgeBaseRef(userId).get();
    return doc.exists ? doc.data() : null;
};

export const getClassesRef = (userId: string) => db.collection("classes").doc(userId);

export const getClassRef = (userId: string, classId: string) =>
    getClassesRef(userId).collection("userClasses").doc(classId);

export const getClasses = async (userId: string) => {
    const classes = await getClassesRef(userId).get();
    return classes.exists ? classes.data() : null;
};

export const addToClass = async (userId: string, classId: string, type: string, data: any) => {
    const classRef = getClassRef(userId, classId);
    await classRef.set(
        {
            attached: {
                [type]: arrayUnion(data),
            },
        },
        { merge: true },
    );
};

export const removeFromClass = async (
    userId: string,
    classId: string,
    type: string,
    idx: number,
) => {
    const classRef = getClassRef(userId, classId);
    const classDoc = await classRef.get();
    if (!classDoc.exists) return;

    const classData = classDoc.data();
    if (!classData || !classData.attached || !Array.isArray(classData.attached[type])) return;

    const updatedArray = [...classData.attached[type]];
    updatedArray.splice(idx, 1);

    await classRef.update({
        attached: {
            [type]: updatedArray,
        },
    });
};

export const updateInClass = async (
    userId: string,
    classId: string,
    type: string,
    idx: any,
    newData: any,
) => {
    const classRef = getClassRef(userId, classId);
    removeFromClass(userId, classId, type, idx);
    await classRef.update({
        attached: {
            [type]: arrayUnion(newData),
        },
    });
};

export const createClass = async (userId: string, name: string) => {
    const classRef = getClassRef(userId, uuidv4());
    const classData = { name, attached: {} };
    await classRef.set(classData, { merge: true });
};

export const updateClassDetails = async (userId: string, classId: string, newName: string) => {
    const classRef = getClassRef(userId, classId);
    await classRef.update({ name: newName });
};

export const deleteClass = async (userId: string, classId: string) => {
    const classRef = getClassRef(userId, classId);
    await classRef.delete();
};

export const getClass = async (userId: string, classId: string) => {
    const classRef = getClassRef(userId, classId);
    const classDoc = await classRef.get();
    return classDoc.exists ? classDoc.data() : null;
};

// AI tools
export const getAIRef = (userId: string) => db.collection("ai").doc(userId);

export const getAIConfig = (userId: string) =>
    getAIRef(userId)
        .get()
        .then((doc) => (doc.exists ? doc.data()!["config"] : null));

export const saveAIConfig = (userId: string, config: any) =>
    getAIRef(userId).set({ config }, { merge: true });

export const getAIAgentsRef = (userId: string) => getAIRef(userId).collection("agents");

export const getAIAgents = async (userId: string) => {
    const snapshot = await getAIAgentsRef(userId).get();
    const agents: Record<string, any> = {};
    snapshot.forEach((doc) => {
        agents[doc.id] = doc.data();
    });
    return agents;
};

export const saveAIAgent = async (
    userId: string,
    agentId: string,
    agentData: Record<string, any>,
) => {
    return getAIAgentsRef(userId).doc(agentId).set(removeUndefinedDeep(agentData), { merge: true });
};

export const getAIAgent = async (userId: string, agentId: string) => {
    const doc = await getAIAgentsRef(userId).doc(agentId).get();
    return doc.exists ? doc.data() : null;
};

export const getAIProfilesRef = (userId: string) => getAIRef(userId).collection("profiles");

export const getAIProfiles = async (userId: string) => {
    const snapshot = await getAIProfilesRef(userId).get();
    const profiles: Record<string, any> = {};
    snapshot.forEach((doc) => {
        profiles[doc.id] = doc.data();
    });
    return profiles;
};

export const getAIProfile = async (userId: string, profileId: string) => {
    const doc = await getAIProfilesRef(userId).doc(profileId).get();
    return doc.exists ? doc.data() : null;
};

export const saveAIProfile = async (
    userId: string,
    profileId: string,
    profileData: Record<string, any>,
) => {
    return getAIProfilesRef(userId)
        .doc(profileId)
        .set(removeUndefinedDeep(profileData), { merge: true });
};

export const deleteAIProfile = async (userId: string, profileId: string) => {
    return getAIProfilesRef(userId).doc(profileId).delete();
};

export const deleteAIAgent = async (userId: string, agentId: string) => {
    return getAIAgentsRef(userId).doc(agentId).delete();
};

export const schema = {
    lms: {
        getCoursesRef: getLMSCoursesRef,
        getAssignmentsRef: getLMSAssignmentsRef,
        getAnnouncementsRef: getLMSAnnouncementsRef,
        saveCourse: saveLMSCourse,
        saveAssignment: saveLMSAssignment,
        saveAnnouncement: saveLMSAnnouncement,
        saveCourses: saveLMSCourses,
        saveAssignments: saveLMSAssignments,
        saveAnnouncements: saveLMSAnnouncements,
        pruneCourses: pruneLMSCourses,
        getCourses: getLMSCourses,
        getAssignments: getLMSAssignments,
        getDueAssignments: getDueLMSAssignments,
        markCompletedOverride: markCompletedOverride,
        getAnnouncements: getLMSAnnouncements,
    },
    timetable: {
        getConfigRef: getTimetableConfigRef,
        getDaysRef: getTimetableDaysRef,
        saveConfig: saveTimetableConfig,
        saveDay: saveTimetableDay,
        deleteThemesByUser,
        deleteData,
        getConfig: getTimetableConfig,
        getDay: getTimetableDay,
        getDays: getTimetableDays,
        cleanupOldCache: cleanupOldTimetableCache,
        deleteCache: deleteTimetableCache,
    },
    themes: {
        getTheme: GetTheme,
        getTopThemes,
        filterThemes,
        searchThemes,
        postTheme,
        updateThemeData,
        getOwnerTheme,
        deleteThemeData,
    },
    knowledgeBase: {
        getRef: getKnowledgeBaseRef,
        save: saveKnowledgeBase,
        get: getKnowledgeBase,
    },
    classes: {
        getRef: getClassesRef,
        getClassRef: getClassRef,
        getClasses,
        addToClass,
        removeFromClass,
        updateInClass,
        createClass,
        updateClassDetails,
        deleteClass,
        getClass,
    },
    ai: {
        getRef: getAIRef,
        getConfig: getAIConfig,
        saveConfig: saveAIConfig,
        getAgentsRef: getAIAgentsRef,
        getAgents: getAIAgents,
        saveAgent: saveAIAgent,
        getAgent: getAIAgent,
        deleteAgent: deleteAIAgent,
        getProfilesRef: getAIProfilesRef,
        getProfiles: getAIProfiles,
        getProfile: getAIProfile,
        saveProfile: saveAIProfile,
        deleteProfile: deleteAIProfile,
    },
};
