import { db } from "./firebase-config.js?v=20260713-firebase-key-fix";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
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
  const directRef = doc(db, "users", studentId);
  const directSnapshot = await getDoc(directRef);

  if (directSnapshot.exists()) {
    return directSnapshot;
  }

  const matches = await getDocs(
    query(
      collection(db, "users"),
      where("studentNo", "==", studentId),
      limit(1),
    ),
  );

  return matches.empty ? null : matches.docs[0];
}

async function isFirstUserAccount() {
  const systemSnapshot = await getDoc(doc(db, "_system", "db"));
  return !systemSnapshot.exists();
}

async function createUserAccount(studentId, password) {
  const ref = doc(db, "users", studentId);
  const firstAccount = await isFirstUserAccount();

  await setDoc(ref, {
    studentNo: studentId,
    password,
    fullName: "Student",
    role: firstAccount ? "admin" : "student",
    active: true,
    autoCreated: true,
    createdAt: serverTimestamp(),
  });

  const snapshot = await getDoc(ref);
  return toSessionUser(snapshot);
}

export async function loginWithStudentCredentials(studentId, password) {
  let userSnapshot = await findUserDocument(studentId);

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
