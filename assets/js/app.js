import { auth } from "./firebase-config.js?v=20260713-firebase-key-fix";
import {
  isValidStudentId,
  studentIdToAuthEmail,
  authEmailToStudentId,
} from "./auth-helpers.js?v=20260713-student-id-login";
import { resolveAuthEmails } from "./auth-resolver.js?v=20260713-student-id-login";
import { bootstrapFirestore } from "./firestore-bootstrap.js?v=20260713-student-id-login";
import { ensureAdminProfile } from "./user-profile.js?v=20260713-student-id-login";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const loginForm = document.querySelector("#login-form");
const loginButton = document.querySelector("#login-button");
const loginButtonLabel = loginButton.querySelector("span");
const logoutButton = document.querySelector("#logout-button");
const passwordInput = document.querySelector("#password");
const passwordToggle = document.querySelector("#password-toggle");
const passwordToggleIcon = passwordToggle.querySelector("i");
const message = document.querySelector("#form-message");
const loginView = document.querySelector("#login-view");
const dashboardView = document.querySelector("#dashboard-view");
const signedInStudentId = document.querySelector("#signed-in-student-id");
const signedInName = document.querySelector("#signed-in-name");
const bootstrapStatus = document.querySelector("#bootstrap-status");
const bootstrapDetail = document.querySelector("#bootstrap-detail");

let pendingStudentId = null;

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

function isRecoverableSignInError(code) {
  return code === "auth/invalid-credential"
    || code === "auth/user-not-found"
    || code === "auth/wrong-password";
}

function signInErrorMessage(error, studentId) {
  switch (error.code) {
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return `The student ID or password is incorrect. In Firebase Authentication, the account email must be ${studentIdToAuthEmail(studentId)}.`;
    case "auth/operation-not-allowed":
      return "Email/Password sign-in is not enabled in Firebase Authentication.";
    case "auth/unauthorized-domain":
      return "This website address is not authorized in Firebase. Add ustporoq.fast-page.org under Authentication → Settings → Authorized domains.";
    case "auth/network-request-failed":
      return "Firebase could not be reached. Check your internet connection and try again.";
    default:
      return `Firebase sign-in failed (${error.code ?? "unknown error"}).`;
  }
}

async function signInWithStudentId(studentId, password) {
  const authEmails = await resolveAuthEmails(studentId);
  let lastError = null;

  for (const authEmail of authEmails) {
    try {
      await signInWithEmailAndPassword(auth, authEmail, password);
      return authEmail;
    } catch (error) {
      lastError = error;
      if (!isRecoverableSignInError(error.code)) {
        throw error;
      }
    }
  }

  throw lastError ?? new Error("Sign-in failed.");
}

passwordToggle.addEventListener("click", () => {
  const isHidden = passwordInput.type === "password";
  passwordInput.type = isHidden ? "text" : "password";
  passwordToggle.setAttribute("aria-pressed", String(isHidden));
  passwordToggle.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
  passwordToggleIcon.className = isHidden ? "bi bi-eye-slash" : "bi bi-eye";
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const studentId = loginForm.studentId.value.trim();
  const password = loginForm.password.value;

  showMessage("");

  if (!isValidStudentId(studentId)) {
    showMessage("Enter a valid 10-digit student ID, for example 2023304637.");
    return;
  }

  pendingStudentId = studentId;
  setLoginBusy(true);

  try {
    await signInWithStudentId(studentId, password);
  } catch (error) {
    pendingStudentId = null;
    console.error("Firebase sign-in failed:", error);
    showMessage(signInErrorMessage(error, studentId));
    setLoginBusy(false);
  }
});

logoutButton.addEventListener("click", () => {
  pendingStudentId = null;
  signOut(auth);
});

onAuthStateChanged(auth, async (user) => {
  setLoginBusy(false);

  if (!user) {
    showLogin();
    return;
  }

  const studentId = pendingStudentId ?? authEmailToStudentId(user.email);
  pendingStudentId = null;

  if (!studentId) {
    await signOut(auth);
    showMessage("This account is not linked to a valid student ID.");
    return;
  }

  try {
    const profile = await ensureAdminProfile(user, studentId);

    if (profile?.role !== "admin") {
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
    console.error("Profile setup failed:", error);
    await signOut(auth);
    showMessage("Firebase is not ready. Enable Firestore and add the security rules from SETUP.md.");
  }
});
