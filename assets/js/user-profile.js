import { db } from "./firebase-config.js?v=20260713-firebase-key-fix";
import {
  authEmailToStudentId,
  studentIdToAuthEmail,
} from "./auth-helpers.js?v=20260713-student-id-login";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

export async function loadUserProfile(user) {
  const profileRef = doc(db, "users", user.uid);
  const profile = await getDoc(profileRef);

  if (!profile.exists()) {
    return null;
  }

  const data = profile.data();
  const studentNo = data.studentNo ?? authEmailToStudentId(user.email);

  return {
    ...data,
    studentNo,
  };
}

export async function ensureAdminProfile(user, studentId) {
  const profileRef = doc(db, "users", user.uid);
  const profileSnapshot = await getDoc(profileRef);
  const authEmail = user.email ?? studentIdToAuthEmail(studentId);

  if (!profileSnapshot.exists()) {
    await setDoc(profileRef, {
      studentNo: studentId,
      email: authEmail,
      fullName: "Administrator",
      role: "admin",
      active: true,
      createdAt: serverTimestamp(),
    });
  } else {
    const data = profileSnapshot.data();
    const updates = {};

    if (!data.studentNo) {
      updates.studentNo = studentId;
    }
    if (!data.email) {
      updates.email = authEmail;
    }
    if (!data.fullName) {
      updates.fullName = "Administrator";
    }
    if (data.active !== true) {
      updates.active = true;
    }
    if (!data.role && (data.studentNo === studentId || !data.studentNo)) {
      updates.role = "admin";
    }

    if (Object.keys(updates).length > 0) {
      await setDoc(profileRef, updates, { merge: true });
    }
  }

  await setDoc(
    doc(db, "studentAccounts", studentId),
    { authEmail, updatedAt: serverTimestamp() },
    { merge: true },
  );

  return loadUserProfile(user);
}
