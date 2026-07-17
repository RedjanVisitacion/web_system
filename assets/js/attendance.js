import { getSession } from "./session.js?v=20260717-layout";
import { generateSidebar, generateAppbar, initLayout, requireAdmin } from "./layout.js?v=20260717-layout";
import { createActivity, getActivities } from "./attendance-db.js?v=20260717-layout";

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
  // Check authentication and admin role
  if (!requireAdmin()) return;

  // Mount sidebar and appbar
  const layoutMount = document.getElementById("layoutMount");
  const appbarMount = document.getElementById("appbarMount");

  if (layoutMount) {
    layoutMount.innerHTML = generateSidebar('attendance');
  }

  if (appbarMount) {
    appbarMount.innerHTML = generateAppbar();
  }

  // Initialize layout functionality
  initLayout();

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

  if (createActivityForm) {
    createActivityForm.addEventListener("submit", async (e) => {
      e.preventDefault(); // Prevent form submission and page refresh
    });
  }

  if (saveActivityBtn && createActivityForm) {
    saveActivityBtn.addEventListener("click", async (e) => {
      e.preventDefault(); // Prevent form submission
      const session = getSession();
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
