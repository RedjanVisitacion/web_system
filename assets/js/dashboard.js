import { getSession, clearSession } from "./session.js?v=20260717-dashboard";

const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const closeSidebar = document.getElementById("closeSidebar");

// Sidebar toggle functionality
if (menuToggle) {
  menuToggle.addEventListener("click", function() {
    sidebar.classList.add("active");
    sidebarOverlay.classList.add("active");
  });
}

if (closeSidebar) {
  closeSidebar.addEventListener("click", function() {
    sidebar.classList.remove("active");
    sidebarOverlay.classList.remove("active");
  });
}

if (sidebarOverlay) {
  sidebarOverlay.addEventListener("click", function() {
    sidebar.classList.remove("active");
    sidebarOverlay.classList.remove("active");
  });
}

// Close sidebar on nav link click (mobile)
document.querySelectorAll(".sidebar .nav-link").forEach(link => {
  link.addEventListener("click", function() {
    if (window.innerWidth <= 992) {
      sidebar.classList.remove("active");
      sidebarOverlay.classList.remove("active");
    }
  });
});

// Handle window resize
window.addEventListener("resize", function() {
  if (window.innerWidth > 992) {
    sidebar.classList.remove("active");
    sidebarOverlay.classList.remove("active");
  }
});

// User menu functionality
function buildUserMenu() {
  const session = getSession();
  const user = session || {};
  const fullName = user.fullName || "Student";
  const studentNo = user.studentNo || "";
  const role = user.role === "admin" ? "Administrator" : "Student";

  return `
<div class="user-info position-relative" id="userMenu">
  <button type="button" class="btn p-0 border-0 bg-transparent d-flex align-items-center gap-2" id="userMenuToggle">
    <div class="user-avatar">
      <i class="bi bi-person"></i>
    </div>
    <div class="user-details">
      <div class="user-name">${escapeHtml(fullName)}</div>
      <div class="user-role">${role} <i class="bi bi-chevron-down chevron-down" aria-hidden="true"></i></div>
    </div>
  </button>

  <div class="user-dropdown" id="userMenuDropdown" style="display:none;">
    <div class="card-body p-3">
      <div class="d-flex align-items-center gap-2 mb-2">
        <div class="user-avatar" style="width:34px; height:34px; font-size:14px;">
          <i class="bi bi-person"></i>
        </div>
        <div>
          <div class="fw-semibold">${escapeHtml(fullName)}</div>
          <div class="small text-muted">${studentNo ? escapeHtml(studentNo) : role}</div>
        </div>
      </div>
      <hr class="my-2">
      <a class="dropdown-item dropdown-item-logout d-flex align-items-center gap-2" href="#" id="userMenuLogoutLink">
        <i class="bi bi-box-arrow-right"></i>
        <span>Logout</span>
      </a>
    </div>
  </div>
</div>
`;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function setMenuOpen(userMenuDropdown, open) {
  if (!userMenuDropdown) return;
  userMenuDropdown.style.display = open ? "block" : "none";
  if (open) userMenuDropdown.setAttribute("data-open", "1");
  else userMenuDropdown.removeAttribute("data-open");
}

// Initialize dashboard
function initDashboard() {
  const session = getSession();
  if (!session) {
    // Redirect to login if no session
    window.location.href = "index.html";
    return;
  }

  // Build user menu
  const userMenuMount = document.getElementById("userMenuMount");
  if (userMenuMount) {
    userMenuMount.innerHTML = buildUserMenu();
  }

  // Setup user menu toggle
  const userMenuToggle = document.getElementById("userMenuToggle");
  const userMenuDropdown = document.getElementById("userMenuDropdown");
  const userMenu = document.getElementById("userMenu");

  if (userMenuToggle && userMenuDropdown) {
    userMenuToggle.addEventListener("click", (e) => {
      e.preventDefault();
      const isOpen = userMenuDropdown.getAttribute("data-open") === "1";
      setMenuOpen(userMenuDropdown, !isOpen);
    });
  }

  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (!userMenuDropdown || !userMenu) return;
    if (userMenuDropdown.getAttribute("data-open") !== "1") return;
    if (!userMenu.contains(e.target)) {
      setMenuOpen(userMenuDropdown, false);
    }
  });

  // Handle logout
  const userMenuLogoutLink = document.getElementById("userMenuLogoutLink");
  if (userMenuLogoutLink) {
    userMenuLogoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      clearSession();
      window.location.href = "index.html";
    });
  }

  // Update welcome banner
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
  // In a real implementation, these would come from your database
  const statCards = {
    totalSessions: document.getElementById("totalSessions"),
    presentToday: document.getElementById("presentToday"),
    lateToday: document.getElementById("lateToday"),
    absentToday: document.getElementById("absentToday")
  };

  // Set initial values (these would be fetched from Firestore in production)
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
