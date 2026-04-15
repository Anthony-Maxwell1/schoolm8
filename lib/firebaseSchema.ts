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

import { db } from "./firebaseAdmin";

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
    return getLMSCoursesRef(userId).doc(courseId).set(courseData, { merge: true });
};

/**
 * Save a single LMS assignment
 */
export const saveLMSAssignment = async (
    userId: string,
    assignmentId: string,
    assignmentData: Record<string, any>,
) => {
    return getLMSAssignmentsRef(userId).doc(assignmentId).set(assignmentData, { merge: true });
};

/**
 * Save a single LMS announcement
 */
export const saveLMSAnnouncement = async (
    userId: string,
    announcementId: string,
    announcementData: Record<string, any>,
) => {
    return getLMSAnnouncementsRef(userId).doc(announcementId).set(announcementData, {
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
        batch.set(coursesRef.doc(courseId), courseData, { merge: true });
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
        batch.set(assignmentsRef.doc(assignmentId), assignmentData, { merge: true });
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
        batch.set(announcementsRef.doc(announcementId), announcementData, { merge: true });
    }

    return batch.commit();
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
    return getTimetableConfigRef(userId).set(configData, { merge: true });
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
            {
                ...dayData,
                date,
                expiry,
            },
            { merge: true },
        );
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
