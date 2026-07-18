import { getSession, clearSession } from "./session.js?v=20260718-profile-dropdown";

/**
 * Generate sidebar HTML with active navigation item
 * @param {string} activePage - The page that should be marked as active
 * @returns {string} - Sidebar HTML
 */
export function generateSidebar(activePage = 'dashboard') {
  const pages = [
    { id: 'dashboard', href: 'dashboard.html', icon: 'bi-house-door', label: 'Dashboard' },
    { id: 'attendance', href: 'attendance.html', icon: 'bi-clipboard-check', label: 'Attendance' },
    { id: 'students', href: '#', icon: 'bi-people', label: 'Students' },
    { id: 'reports', href: '#', icon: 'bi-file-earmark-bar-graph', label: 'Reports' }
  ];

  const navItems = pages.map(page => `
    <li class="nav-item">
      <a class="nav-link ${page.id === activePage ? 'active' : ''}" href="${page.href}" id="nav${page.id.charAt(0).toUpperCase() + page.id.slice(1)}">
        <i class="bi ${page.icon}"></i>
        <span>${page.label}</span>
      </a>
    </li>
  `).join('');

  return `
    <!-- Sidebar Overlay for Mobile -->
    <div class="sidebar-overlay" id="sidebarOverlay"></div>

    <!-- Sidebar -->
    <div class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-header-content">
          <div class="logo-container">
            <img class="sidebar-logo" src="assets/img/USTP-ORO.png" alt="USTP Logo">
            <div class="wordmark">
              <span class="wordmark-main">Attendance</span>
              <span class="wordmark-sub">System</span>
            </div>
          </div>
          <button class="btn-close-sidebar" id="closeSidebar">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      </div>
      <div class="sidebar-menu">
        <ul class="nav flex-column">
          ${navItems}
        </ul>
      </div>
    </div>
  `;
}

/**
 * Generate appbar HTML
 * @returns {string} - Appbar HTML
 */
export function generateAppbar() {
  return `
    <!-- Top Navbar -->
    <nav class="top-navbar">
      <button class="menu-toggle" id="menuToggle">
        <i class="bi bi-list"></i>
      </button>
      <div id="userMenuMount"></div>
    </nav>
  `;
}

/**
 * Generate user menu HTML
 * @returns {string} - User menu HTML
 */
export function generateUserMenu() {
  const session = getSession();
  const user = session || {};
  const fullName = user.fullName || "Student";
  const studentNo = user.studentNo || "";
  const role = user.role === "admin" ? "Administrator" : "Student";

  return `
<div id="userMenu">
  <button type="button" class="user-menu-toggle" id="userMenuToggle">
    <div class="user-avatar">
      <i class="bi bi-person"></i>
    </div>
    <div class="user-details">
      <div class="user-name">${escapeHtml(fullName)}</div>
      <div class="user-role">${role} <i class="bi bi-chevron-down chevron-down" aria-hidden="true"></i></div>
    </div>
  </button>

  <div class="user-dropdown" id="userMenuDropdown" style="display:none;">
    <div class="user-dropdown-body">
      <div class="dropdown-user-info">
        <div class="user-avatar user-avatar--sm">
          <i class="bi bi-person"></i>
        </div>
        <div class="dropdown-user-text">
          <div class="dropdown-user-name">${escapeHtml(fullName)}</div>
          <div class="dropdown-user-meta">${studentNo ? escapeHtml(studentNo) : role}</div>
        </div>
      </div>
      <hr class="user-dropdown-divider">
      <a class="dropdown-item dropdown-item-logout" href="#" id="userMenuLogoutLink">
        <i class="bi bi-box-arrow-right"></i>
        <span>Logout</span>
      </a>
    </div>
  </div>
</div>
`;
}

/**
 * Initialize common layout functionality
 */
export function initLayout() {
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

  // Close sidebar on nav link click (mobile); block placeholder links
  document.querySelectorAll(".sidebar .nav-link").forEach(link => {
    link.addEventListener("click", function(event) {
      const href = link.getAttribute("href");
      if (!href || href === "#") {
        event.preventDefault();
        return;
      }

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

  // Build and mount user menu
  const userMenuMount = document.getElementById("userMenuMount");
  if (userMenuMount) {
    userMenuMount.innerHTML = generateUserMenu();
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
}

/**
 * Set menu open state
 */
function setMenuOpen(userMenuDropdown, open) {
  if (!userMenuDropdown) return;
  userMenuDropdown.style.display = open ? "block" : "none";
  if (open) userMenuDropdown.setAttribute("data-open", "1");
  else userMenuDropdown.removeAttribute("data-open");
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Check if user is authenticated
 * @returns {boolean} - True if user is authenticated
 */
export function isAuthenticated() {
  return getSession() !== null;
}

/**
 * Check if user is admin
 * @returns {boolean} - True if user is admin
 */
export function isAdmin() {
  const session = getSession();
  return session && session.role === "admin";
}

/**
 * Redirect if not authenticated
 */
export function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = "index.html";
    return false;
  }
  return true;
}

/**
 * Redirect if not admin
 */
export function requireAdmin() {
  if (!requireAuth()) return false;
  if (!isAdmin()) {
    alert("Access denied. Administrators only.");
    window.location.href = "dashboard.html";
    return false;
  }
  return true;
}
