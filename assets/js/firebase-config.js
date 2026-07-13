import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// Firebase web configuration identifies this web client; it is not a secret.
// Protect user data with Firebase Authentication and Firestore Security Rules.
const firebaseConfig = {
  apiKey: "AIzaSyDy68HVlSSSTHajIGh1Z3ZPSzDsca60gIA",
  authDomain: "attendance-system-57aa9.firebaseapp.com",
  projectId: "attendance-system-57aa9",
  storageBucket: "attendance-system-57aa9.firebasestorage.app",
  messagingSenderId: "504550712242",
  appId: "1:504550712242:web:f883f18bd965dddaec7aab",
  measurementId: "G-5DEX8GB3HK",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
