import { getSession, clearSession } from "./session.js?v=20260717-attendance";
import { createActivity, getActivities } from "./attendance-db.js?v=20260717-attendance";

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
<div id="userMenu">
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

// Activities storage
let activities = [];

// Activity type labels
const activityTypeLabels = {
  lecture: "Lecture",
  lab: "Laboratory",
  exam: "Exam",
  seminar: "Seminar",
  other: "Other"
};

// Render activities list
function renderActivities() {
  const activitiesList = document.getElementById("activitiesList");
  if (!activitiesList) return;

  if (activities.length === 0) {
    activitiesList.innerHTML = `
      <div class="text-muted text-center py-4">
        <i class="bi bi-inbox fs-1 mb-2 d-block"></i>
        No activities created yet
      </div>
    `;
    return;
  }

  activitiesList.innerHTML = activities.map(activity => `
    <div class="activity-item" data-id="${activity.id}">
      <div class="activity-header">
        <div class="activity-name">${escapeHtml(activity.name)}</div>
        <span class="activity-type activity-type-${activity.type}">${activityTypeLabels[activity.type] || activity.type}</span>
      </div>
      <div class="activity-details">
        <div class="activity-detail">
          <i class="bi bi-calendar"></i>
          <span>${formatDate(activity.date)}</span>
        </div>
        <div class="activity-detail">
          <i class="bi bi-clock"></i>
          <span>${formatTime(activity.time)}</span>
        </div>
        <div class="activity-detail">
          <i class="bi bi-geo-alt"></i>
          <span>${escapeHtml(activity.location)}</span>
        </div>
      </div>
      ${activity.description ? `
        <div class="activity-description">
          ${escapeHtml(activity.description)}
        </div>
      ` : ''}
    </div>
  `).join('');
}

// Load activities from Firestore
async function loadActivities() {
  try {
    activities = await getActivities();
    renderActivities();
  } catch (error) {
    console.error("Error loading activities:", error);
    alert("Failed to load activities. Please check your internet connection.");
  }
}

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

// Format time for display
function formatTime(timeString) {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

// Initialize attendance page
function initAttendancePage() {
  const session = getSession();
  if (!session) {
    // Redirect to login if no session
    window.location.href = "index.html";
    return;
  }

  // Check if user is admin
  if (session.role !== "admin") {
    alert("Only administrators can manage attendance activities.");
    window.location.href = "dashboard.html";
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

  // Setup create activity modal
  const createActivityBtn = document.getElementById("createActivityBtn");
  const createActivityModal = document.getElementById("createActivityModal");
  const saveActivityBtn = document.getElementById("saveActivityBtn");
  const createActivityForm = document.getElementById("createActivityForm");

  if (createActivityBtn && createActivityModal) {
    createActivityBtn.addEventListener("click", () => {
      const modal = new bootstrap.Modal(createActivityModal);
      modal.show();
    });
  }

  if (saveActivityBtn && createActivityForm) {
    saveActivityBtn.addEventListener("click", async () => {
      const name = document.getElementById("activityName").value.trim();
      const date = document.getElementById("activityDate").value;
      const time = document.getElementById("activityTime").value;
      const location = document.getElementById("activityLocation").value.trim();
      const type = document.getElementById("activityType").value;
      const description = document.getElementById("activityDescription").value.trim();

      // Validation
      if (!name || !date || !time || !location || !type) {
        alert("Please fill in all required fields.");
        return;
      }

      // Disable button while saving
      saveActivityBtn.disabled = true;
      saveActivityBtn.textContent = "Creating...";

      try {
        // Create activity object
        const activityData = {
          name,
          date,
          time,
          location,
          type,
          description,
          createdBy: session.studentNo,
          createdByFullName: session.fullName
        };

        // Save to Firestore
        const activityId = await createActivity(activityData);

        // Add to local array with the Firestore ID
        activities.unshift({
          id: activityId,
          ...activityData,
          createdAt: new Date().toISOString()
        });

        // Render updated list
        renderActivities();

        // Close modal and reset form
        const modal = bootstrap.Modal.getInstance(createActivityModal);
        if (modal) {
          modal.hide();
        }
        createActivityForm.reset();

        // Set default date to today
        document.getElementById("activityDate").valueAsDate = new Date();

        alert("Activity created successfully!");
      } catch (error) {
        console.error("Error creating activity:", error);
        alert("Failed to create activity. Please check your internet connection and try again.");
      } finally {
        // Re-enable button
        saveActivityBtn.disabled = false;
        saveActivityBtn.textContent = "Create Activity";
      }
    });
  }

  // Set default date to today
  const activityDateInput = document.getElementById("activityDate");
  if (activityDateInput) {
    activityDateInput.valueAsDate = new Date();
  }

  // Load activities from Firestore
  loadActivities();
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAttendancePage);
} else {
  initAttendancePage();
}
