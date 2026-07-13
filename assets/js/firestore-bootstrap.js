import { db } from "./firebase-config.js?v=20260713-firebase-key-fix";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const BOOTSTRAP_VERSION = 1;

const DEFAULT_SCHOOL_SETTINGS = {
  schoolName: "USTP Oroquieta",
  lateGraceMinutes: 15,
  requireLocation: false,
  academicYear: "2025-2026",
};

async function ensureDocument(collectionId, documentId, data) {
  const ref = doc(db, collectionId, documentId);
  const snapshot = await getDoc(ref);

  if (snapshot.exists()) {
    return { created: false, path: `${collectionId}/${documentId}` };
  }

  await setDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
  });

  return { created: true, path: `${collectionId}/${documentId}` };
}

export async function bootstrapFirestore() {
  const results = [];

  results.push(
    await ensureDocument("schoolSettings", "attendance", DEFAULT_SCHOOL_SETTINGS),
  );

  const systemRef = doc(db, "_system", "db");
  const systemSnapshot = await getDoc(systemRef);

  if (!systemSnapshot.exists()) {
    await setDoc(systemRef, {
      version: BOOTSTRAP_VERSION,
      initializedAt: serverTimestamp(),
      collections: [
        "users",
        "courses",
        "enrollments",
        "attendanceSessions",
        "attendance",
        "schoolSettings",
      ],
      note: "Created automatically on first administrator sign-in.",
    });
    results.push({ created: true, path: "_system/db" });
  } else {
    results.push({ created: false, path: "_system/db" });
  }

  const created = results.filter((entry) => entry.created);
  return {
    createdCount: created.length,
    createdPaths: created.map((entry) => entry.path),
    alreadyInitialized: created.length === 0,
  };
}
