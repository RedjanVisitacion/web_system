import { db } from "./firebase-config.js?v=20260714-login-fix";
import {
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

function toSessionUser(documentSnapshot) {
  const data = documentSnapshot.data();

  return {
    id: documentSnapshot.id,
    studentNo: data.studentNo ?? documentSnapshot.id,
    fullName: data.fullName ?? "Student",
    role: data.role ?? "student",
  };
}

async function findUserDocument(studentId) {
  const snapshot = await getDoc(doc(db, "users", studentId));
  return snapshot.exists() ? snapshot : null;
}

async function isFirstUserAccount() {
  const systemSnapshot = await getDoc(doc(db, "_system", "db"));
  return !systemSnapshot.exists();
}

async function createUserAccount(studentId, password) {
  const ref = doc(db, "users", studentId);
  const firstAccount = await isFirstUserAccount();
  const role = firstAccount ? "admin" : "student";

  await setDoc(ref, {
    studentNo: studentId,
    password,
    fullName: "Student",
    role,
    active: true,
  });

  return {
    id: studentId,
    studentNo: studentId,
    fullName: "Student",
    role,
  };
}

export async function loginWithStudentCredentials(studentId, password) {
  const userSnapshot = await findUserDocument(studentId);

  if (!userSnapshot) {
    const user = await createUserAccount(studentId, password);
    return { ok: true, user, created: true };
  }

  const data = userSnapshot.data();

  if (data.active === false) {
    return { ok: false, reason: "inactive" };
  }

  if (typeof data.password !== "string" || data.password !== password) {
    return { ok: false, reason: "invalid-credentials" };
  }

  return {
    ok: true,
    user: toSessionUser(userSnapshot),
    created: false,
  };
}

export function loginErrorMessage(reason) {
  switch (reason) {
    case "inactive":
      return "This account is inactive. Contact your administrator.";
    case "invalid-credentials":
    case "not-found":
    default:
      return "The student ID or password is incorrect.";
  }
}
