import { getSession } from "./session.js?v=20260718-attendance-nav";
import { mountPageLayout, requireAuth, isAdmin } from "./layout.js?v=20260718-attendance-nav";

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

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function showAdminOnlyMessage() {
  const contentArea = document.querySelector(".content-area");
  if (!contentArea) return;

  contentArea.innerHTML = `
    <div class="page-header">
      <h1>Access Denied</h1>
      <p class="text-muted">Attendance management is available to administrators only.</p>
    </div>
  `;
}

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

async function loadActivities(getActivities) {
  try {
    activities = await getActivities();
    renderActivities();
  } catch (error) {
    console.error("Error loading activities:", error);
    alert("Failed to load activities. Please check your internet connection.");
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function formatTime(timeString) {
  const [hours, minutes] = timeString.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function setupAttendanceFeatures(createActivity, getActivities) {
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
    createActivityForm.addEventListener("submit", (event) => {
      event.preventDefault();
    });
  }

  if (saveActivityBtn && createActivityForm) {
    saveActivityBtn.addEventListener("click", async (event) => {
      event.preventDefault();
      const session = getSession();
      const name = document.getElementById("activityName").value.trim();
      const date = document.getElementById("activityDate").value;
      const time = document.getElementById("activityTime").value;
      const location = document.getElementById("activityLocation").value.trim();
      const type = document.getElementById("activityType").value;
      const description = document.getElementById("activityDescription").value.trim();

      if (!name || !date || !time || !location || !type) {
        alert("Please fill in all required fields.");
        return;
      }

      saveActivityBtn.disabled = true;
      saveActivityBtn.textContent = "Creating...";

      try {
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

        const activityId = await createActivity(activityData);

        activities.unshift({
          id: activityId,
          ...activityData,
          createdAt: new Date().toISOString()
        });

        renderActivities();

        const modal = bootstrap.Modal.getInstance(createActivityModal);
        if (modal) {
          modal.hide();
        }
        createActivityForm.reset();
        document.getElementById("activityDate").valueAsDate = new Date();
        alert("Activity created successfully!");
      } catch (error) {
        console.error("Error creating activity:", error);
        alert("Failed to create activity. Please check your internet connection and try again.");
      } finally {
        saveActivityBtn.disabled = false;
        saveActivityBtn.textContent = "Create Activity";
      }
    });
  }

  const activityDateInput = document.getElementById("activityDate");
  if (activityDateInput) {
    activityDateInput.valueAsDate = new Date();
  }

  loadActivities(getActivities);
}

async function initAttendancePage() {
  if (!requireAuth()) return;

  mountPageLayout("attendance");

  if (!isAdmin()) {
    showAdminOnlyMessage();
    return;
  }

  try {
    const { createActivity, getActivities } = await import("./attendance-db.js?v=20260718-attendance-nav");
    setupAttendanceFeatures(createActivity, getActivities);
  } catch (error) {
    console.error("Failed to initialize attendance features:", error);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAttendancePage);
} else {
  initAttendancePage();
}
