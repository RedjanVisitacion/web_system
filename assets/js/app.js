import { isValidStudentId } from "./auth-helpers.js?v=20260713-db-login";
import { loginWithStudentCredentials, loginErrorMessage } from "./db-login.js?v=20260713-db-login";
import { bootstrapFirestore } from "./firestore-bootstrap.js?v=20260713-db-login";
import { clearSession, getSession, saveSession } from "./session.js?v=20260713-db-login";

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
const portalLabel = document.querySelector("#portal-label");
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

function showDashboard(user) {
  signedInStudentId.textContent = user.studentNo
    ? `Student ID: ${user.studentNo}`
    : "";
  signedInName.textContent = user.fullName ?? "Student";
  portalLabel.textContent = user.role === "admin"
    ? "Administrator Portal"
    : "Student Portal";
  loginView.hidden = true;
  dashboardView.hidden = false;
}

function setBootstrapStatus(title, detail) {
  bootstrapStatus.textContent = title;
  bootstrapDetail.textContent = detail;
}

async function initializeDatabaseIfAdmin(user) {
  if (user.role !== "admin") {
    setBootstrapStatus("Signed in", "Your attendance dashboard will open here next.");
    return;
  }

  try {
    const bootstrap = await bootstrapFirestore();
    if (bootstrap.alreadyInitialized) {
      setBootstrapStatus("Database connected", "Collections are ready.");
    } else {
      setBootstrapStatus(
        "Database initialized",
        `Created default documents: ${bootstrap.createdPaths.join(", ")}.`,
      );
    }
  } catch (error) {
    console.error("Firestore bootstrap failed:", error);
    setBootstrapStatus(
      "Signed in",
      "Could not auto-create default database documents. Check Firestore rules in SETUP.md.",
    );
  }
}

async function enterDashboard(user) {
  showDashboard(user);
  await initializeDatabaseIfAdmin(user);
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

  setLoginBusy(true);

  try {
    const result = await loginWithStudentCredentials(studentId, password);

    if (!result.ok) {
      showMessage(loginErrorMessage(result.reason));
      return;
    }

    saveSession(result.user);
    await enterDashboard(result.user);
  } catch (error) {
    console.error("Database sign-in failed:", error);
    showMessage("Could not reach the database. Check your internet connection and Firestore rules.");
  } finally {
    setLoginBusy(false);
  }
});

logoutButton.addEventListener("click", () => {
  clearSession();
  showLogin();
  showMessage("");
});

const existingSession = getSession();
if (existingSession) {
  enterDashboard(existingSession);
} else {
  showLogin();
}
