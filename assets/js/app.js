import { auth, db } from "./firebase-config.js";
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
const logoutButton = document.querySelector("#logout-button");
const message = document.querySelector("#form-message");
const loginView = document.querySelector("#login-view");
const dashboardView = document.querySelector("#dashboard-view");
const signedInEmail = document.querySelector("#signed-in-email");

function showMessage(text) {
  message.textContent = text;
  message.hidden = !text;
}

function setLoginBusy(isBusy) {
  loginButton.disabled = isBusy;
  loginButton.textContent = isBusy ? "Signing in…" : "Sign in securely";
}

function showLogin() {
  dashboardView.hidden = true;
  loginView.hidden = false;
}

function showDashboard(email) {
  signedInEmail.textContent = email;
  loginView.hidden = true;
  dashboardView.hidden = false;
}

function signInErrorMessage(error) {
  switch (error.code) {
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "The email address or password is incorrect.";
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

async function requireAdmin(user) {
  const profile = await getDoc(doc(db, "users", user.uid));
  return profile.exists() && profile.data().role === "admin";
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = loginForm.email.value.trim();
  const password = loginForm.password.value;

  showMessage("");
  setLoginBusy(true);
  try {
    await signInWithEmailAndPassword(auth, email, password);
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
    if (!await requireAdmin(user)) {
      await signOut(auth);
      showMessage("This account is not authorized for the administrator portal.");
      return;
    }
    showDashboard(user.email ?? "Administrator");
  } catch (error) {
    await signOut(auth);
    showMessage("Firebase is not ready. Enable Firestore and add the security rules from SETUP.md.");
  }
});
