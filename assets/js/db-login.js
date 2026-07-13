import { db } from "./firebase-config.js?v=20260713-firebase-key-fix";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
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

export async function loginWithStudentCredentials(studentId, password) {
  const directRef = doc(db, "users", studentId);
  const directSnapshot = await getDoc(directRef);

  let userSnapshot = directSnapshot.exists() ? directSnapshot : null;

  if (!userSnapshot) {
    const matches = await getDocs(
      query(
        collection(db, "users"),
        where("studentNo", "==", studentId),
        limit(1),
      ),
    );

    if (!matches.empty) {
      userSnapshot = matches.docs[0];
    }
  }

  if (!userSnapshot) {
    return { ok: false, reason: "not-found" };
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
