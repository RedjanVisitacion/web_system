import { getSession } from "./session.js?v=20260718-nav-fix";
import { mountPageLayout, requireAuth } from "./layout.js?v=20260718-nav-fix";

// Initialize dashboard
function initDashboard() {
  if (!requireAuth()) return;

  mountPageLayout("dashboard");

  // Display user information
  const session = getSession();
  const welcomeTitle = document.getElementById("welcomeTitle");
  const welcomeSubtitle = document.getElementById("welcomeSubtitle");
  const welcomeName = document.getElementById("welcomeName");
  const studentIdDisplay = document.getElementById("studentIdDisplay");

  if (welcomeTitle) {
    welcomeTitle.textContent = `Welcome back, ${session.fullName?.split(" ")[0] || "Student"}`;
  }
  if (welcomeSubtitle && session.studentNo) {
    studentIdDisplay.textContent = session.studentNo;
  }
  if (welcomeName && session.fullName) {
    welcomeName.textContent = session.fullName;
  }

  // Update database status based on role
  const dbStatusTitle = document.getElementById("dbStatusTitle");
  const dbStatusDetail = document.getElementById("dbStatusDetail");

  if (session.role === "admin") {
    if (dbStatusTitle) dbStatusTitle.textContent = "Database Connected";
    if (dbStatusDetail) dbStatusDetail.textContent = "Collections are ready. Attendance tracking is active.";
  } else {
    if (dbStatusTitle) dbStatusTitle.textContent = "System Ready";
    if (dbStatusDetail) dbStatusDetail.textContent = "Your attendance dashboard is ready for use.";
  }

  // Initialize stat cards with placeholder data
  const statCards = {
    totalSessions: document.getElementById("totalSessions"),
    presentToday: document.getElementById("presentToday"),
    lateToday: document.getElementById("lateToday"),
    absentToday: document.getElementById("absentToday")
  };

  if (statCards.totalSessions) statCards.totalSessions.textContent = "0";
  if (statCards.presentToday) statCards.presentToday.textContent = "0";
  if (statCards.lateToday) statCards.lateToday.textContent = "0";
  if (statCards.absentToday) statCards.absentToday.textContent = "0";
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDashboard);
} else {
  initDashboard();
}
