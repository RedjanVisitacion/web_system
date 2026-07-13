import { db } from "./firebase-config.js?v=20260713-firebase-key-fix";
import { studentIdToAuthEmail } from "./auth-helpers.js?v=20260713-student-id-login";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

export async function resolveAuthEmails(studentId) {
  const candidates = [studentIdToAuthEmail(studentId)];

  try {
    const accountSnapshot = await getDoc(doc(db, "studentAccounts", studentId));
    if (accountSnapshot.exists()) {
      const authEmail = accountSnapshot.data().authEmail?.trim();
      if (authEmail && !candidates.includes(authEmail)) {
        candidates.unshift(authEmail);
      }
    }
  } catch (error) {
    console.warn("Could not read studentAccounts lookup:", error);
  }

  return candidates;
}
