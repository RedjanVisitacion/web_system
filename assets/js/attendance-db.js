import { db } from "./firebase-config.js?v=20260717-attendance-db";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  where,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const ACTIVITIES_COLLECTION = "attendanceSessions";

/**
 * Create a new activity in Firestore
 * @param {Object} activityData - Activity data
 * @returns {Promise<string>} - The document ID of the created activity
 */
export async function createActivity(activityData) {
  try {
    console.log("Creating activity with data:", activityData);
    console.log("Collection:", ACTIVITIES_COLLECTION);
    const docRef = await addDoc(collection(db, ACTIVITIES_COLLECTION), {
      ...activityData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log("Activity created with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creating activity:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    throw error;
  }
}

/**
 * Get all activities from Firestore
 * @returns {Promise<Array>} - Array of activity objects
 */
export async function getActivities() {
  try {
    console.log("Fetching activities from collection:", ACTIVITIES_COLLECTION);
    const q = query(
      collection(db, ACTIVITIES_COLLECTION),
      orderBy("date", "desc"),
      orderBy("time", "desc")
    );
    const querySnapshot = await getDocs(q);
    
    console.log("Query snapshot size:", querySnapshot.size);
    
    const activities = [];
    querySnapshot.forEach((doc) => {
      console.log("Activity document:", doc.id, doc.data());
      activities.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    
    console.log("Total activities loaded:", activities.length);
    return activities;
  } catch (error) {
    console.error("Error getting activities:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    throw error;
  }
}

/**
 * Get activities by date range
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<Array>} - Array of activity objects
 */
export async function getActivitiesByDateRange(startDate, endDate) {
  try {
    const q = query(
      collection(db, ACTIVITIES_COLLECTION),
      where("date", ">=", startDate),
      where("date", "<=", endDate),
      orderBy("date", "desc"),
      orderBy("time", "desc")
    );
    const querySnapshot = await getDocs(q);
    
    const activities = [];
    querySnapshot.forEach((doc) => {
      activities.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    
    return activities;
  } catch (error) {
    console.error("Error getting activities by date range:", error);
    throw error;
  }
}
