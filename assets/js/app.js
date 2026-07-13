import { auth, db } from "./firebase-config.js?v=20260713-firebase-key-fix";
import {
  isValidStudentId,
  studentIdToAuthEmail,
  authEmailToStudentId,
} from "./auth-helpers.js?v=20260713-student-id-login";
import { bootstrapFirestore } from "./firestore-bootstrap.js?v=20260713-student-id-login";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const loginForm = document.querySelector("#login-form");
const loginButton = document.querySelector("#login-button");
const loginButtonLabel = loginButton.querySelector("span");
const logoutButton = document.querySelector("#logout-button");
const message = document.querySelector("#form-message");
const loginView = document.querySelector("#login-view");
const dashboardView = document.querySelector("#dashboard-view");
const signedInStudentId = document.querySelector("#signed-in-student-id");
const signedInName = document.querySelector("#signed-in-name");
const bootstrapStatus = document.querySelector("#bootstrap-status");
const bootstrapDetail = document.querySelector("#bootstrap-detail");

function showMessage(text) {
  message.textContent = text;
  message.hidden = !text;
}

function setLoginBusy(isBusy) {
  loginButton.disabled = isBusy;
  loginButtonLabel.textContent = isBusy ? "Signing in…" : "Sign in securely";
}

function showLogin() {
  dashboardView.hidden = true;
  loginView.hidden = false;
}

function showDashboard(profile) {
  signedInStudentId.textContent = profile.studentNo
    ? `Student ID: ${profile.studentNo}`
    : "";
  signedInName.textContent = profile.fullName ?? "Administrator";
  loginView.hidden = true;
  dashboardView.hidden = false;
}

function setBootstrapStatus(title, detail) {
  bootstrapStatus.textContent = title;
  bootstrapDetail.textContent = detail;
}

function signInErrorMessage(error) {
  switch (error.code) {
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "The student ID or password is incorrect.";
    case "auth/operation-not-allowed":
      return "Email/Password sign-in is not enabled in Firebase Authentication.";
    case "auth/unauthorized-domain":
      return "This website address is not authorized in Firebase. Open it with Live Server (localhost), not as a file.";
    case "auth/network-request-failed":
      return "Firebase could not be reached. Check your internet connection and try again.";
    default:
      return `Firebase sign-in failed (${error.code ?? "unknown error"}).`;
  }
}

async function loadUserProfile(user) {
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

async function requireAdmin(user) {
  const profile = await loadUserProfile(user);
  return profile?.role === "admin" ? profile : null;
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const studentId = loginForm.studentId.value.trim();
  const password = loginForm.password.value;

  showMessage("");

  if (!isValidStudentId(studentId)) {
    showMessage("Enter a valid 10-digit student ID, for example 2023304637.");
    return;
  }

  setLoginBusy(true);
  try {
    const authEmail = studentIdToAuthEmail(studentId);
    await signInWithEmailAndPassword(auth, authEmail, password);
  } catch (error) {
    console.error("Firebase sign-in failed:", error);
    showMessage(signInErrorMessage(error));
    setLoginBusy(false);
  }
});

logoutButton.addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, async (user) => {
  setLoginBusy(false);

  if (!user) {
    showLogin();
    return;
  }

  try {
    const profile = await requireAdmin(user);

    if (!profile) {
      await signOut(auth);
      showMessage("This account is not authorized for the administrator portal.");
      return;
    }

    showDashboard(profile);

    try {
      const bootstrap = await bootstrapFirestore();
      if (bootstrap.alreadyInitialized) {
        setBootstrapStatus("Firebase is connected", "Database collections are ready.");
      } else {
        setBootstrapStatus(
          "Database initialized",
          `Created default documents: ${bootstrap.createdPaths.join(", ")}.`,
        );
      }
    } catch (bootstrapError) {
      console.error("Firestore bootstrap failed:", bootstrapError);
      setBootstrapStatus(
        "Firebase is connected",
        "Could not auto-create default database documents. Check Firestore rules in SETUP.md.",
      );
    }
  } catch (error) {
    await signOut(auth);
    showMessage("Firebase is not ready. Enable Firestore and add the security rules from SETUP.md.");
  }
});
