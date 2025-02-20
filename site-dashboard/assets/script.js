let userLoggedIn = false;
let userName = "Mohan Lu";
let userRole = "Seller";
let userProfileImage = "https://banner2.cleanpng.com/20180324/whq/av077g98s.webp";

// Global handler: override HTMX push-url so only the hash is used.
document.body.addEventListener("htmx:beforePushUrl", function(evt) {
  const trigger = evt.detail.elt;
  if (trigger && trigger.getAttribute("href")) {
    evt.detail.path = trigger.getAttribute("href");
  }
});

// -------------------------
// UI FUNCTIONS
// -------------------------
function toggleSidebar() {
  const sidebar = document.querySelector(".sidebar");
  const mainContent = document.querySelector(".main-content");
  const header = document.querySelector(".header");
  if (window.innerWidth <= 768) {
    sidebar.classList.toggle("show");
  } else {
    sidebar.classList.toggle("collapsed");
    mainContent.classList.toggle("collapsed");
    header.classList.toggle("collapsed");
  }
}

function toggleTheme() {
  document.documentElement.classList.toggle("dark");
  const icon = document.querySelector(".theme-toggle i");
  icon.classList.add("switching");
  if (icon.classList.contains("fa-moon")) {
    icon.classList.remove("fa-moon");
    icon.classList.add("fa-sun");
  } else {
    icon.classList.remove("fa-sun");
    icon.classList.add("fa-moon");
  }
  setTimeout(() => {
    icon.classList.remove("switching");
  }, 800);
}

function toggleNotifications() {
  document.querySelector(".profile-menu").classList.remove("show");
  document.querySelector(".notifications-popup").classList.toggle("show");
}

function toggleProfile() {
  const profileMenu = document.querySelector(".profile-menu");
  profileMenu.classList.toggle("show");
}

// -------------------------
// INITIALIZE USER PROFILE
// -------------------------
const profileImageElement = document.getElementById("profile-image");
const userNameElement = document.getElementById("user-name");
const userRoleElement = document.getElementById("user-role");
const loginRegisterLink = document.getElementById("login-register");
const settingsLink = document.getElementById("settings-link");
const logoutLink = document.getElementById("logout-link");

profileImageElement.src = userProfileImage || "https://path/to/default/profile/icon.png";
userNameElement.textContent = userName || "Guest";
userRoleElement.textContent = userRole || "Not logged in";

if (userLoggedIn) {
  loginRegisterLink.style.display = "none";
  settingsLink.style.display = "block";
  logoutLink.style.display = "block";
} else {
  loginRegisterLink.style.display = "block";
  settingsLink.style.display = "none";
  logoutLink.style.display = "none";
}

document.addEventListener("click", function (event) {
  const notifications = document.querySelector(".notifications");
  const profile = document.querySelector(".profile");
  const notificationsPopup = document.querySelector(".notifications-popup");
  const profileMenu = document.querySelector(".profile-menu");
  if (!notifications.contains(event.target)) {
    notificationsPopup.classList.remove("show");
  }
  if (!profile.contains(event.target)) {
    profileMenu.classList.remove("show");
  }
});

if (window.innerWidth <= 768) {
  document.querySelector(".sidebar").classList.add("collapsed");
  document.querySelector(".main-content").classList.add("collapsed");
  document.querySelector(".header").classList.add("collapsed");
}

// -------------------------
// NAVIGATION ACTIVE STATE
// -------------------------
function updateActiveNav() {
  let currentHash = window.location.hash || "#dashboard";
  // When viewing project details, clear active state.
  if (currentHash.startsWith("#project-details")) {
    document.querySelectorAll(".sidebar nav a.nav-item").forEach(item => item.classList.remove("active"));
    return;
  }
  document.querySelectorAll(".sidebar nav a.nav-item").forEach((item) => {
    if (item.getAttribute("href") === currentHash) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
}
window.addEventListener("hashchange", updateActiveNav);
document.body.addEventListener("htmx:afterSwap", function (evt) {
  if (evt.detail.target.id === "content") {
    updateActiveNav();
  }
});

// -------------------------
// DASHBOARD LOADING
// -------------------------
function loadDashboard() {
  if (window.defaultDashboardContent) {
    document.getElementById("content").innerHTML = window.defaultDashboardContent;
  }
}

// -------------------------
// PROJECTS & SORTING (for Explore)
// -------------------------
let projectsData = [];
function loadProjects() {
  fetch("/contents/projects.json")
    .then((response) => response.json())
    .then((projects) => {
      projectsData = projects;
      displayProjects(projectsData);
    })
    .catch((error) => console.error("Error loading projects:", error));
}
function displayProjects(projects) {
  const projectsGrid = document.getElementById("projects-grid");
  if (projectsGrid) {
    projectsGrid.innerHTML = "";
    projects.forEach((project) => {
      const projectCard = createProjectCard(project);
      projectsGrid.appendChild(projectCard); // Add this line
    });
  }
}
function createProjectCard(project) {
  let imageUrl = project.image;
  if (!imageUrl.startsWith("/")) {
    imageUrl = "/" + imageUrl;
  }
  const card = document.createElement("div");
  card.className = "project-card";
  card.innerHTML = `
    <img src="${imageUrl}" alt="${project.name}" class="project-image">
    <h2>${project.name}</h2>
    <p>${project.description}</p>
    <div class="project-stats">
      <span>👁 ${project.clicks}</span>
      <span>❤️ ${project.likes}</span>
    </div>
  `;
  // When a card is clicked, update clicks and open the modal with details.
  card.addEventListener("click", () => {
    project.clicks++;
    displayProjects(projectsData); // update click count in grid
    openProjectModal(project);
  });
  return card;
}
function sortProjects(sortBy, order) {
  let sortedProjects = projectsData.slice();
  sortedProjects.sort((a, b) =>
    order === "asc" ? a[sortBy] - b[sortBy] : b[sortBy] - a[sortBy]
  );
  displayProjects(sortedProjects);
}

// -------------------------
// MODAL FUNCTIONS (Project Details)
// -------------------------
function openProjectModal(project) {
  const modalBody = document.getElementById("modal-body");
  modalBody.innerHTML = `
    <div class="modal-header">
      <h2>${project.name}</h2>
    </div>
    <img src="${project.image}" alt="${project.name}" class="modal-project-image" onerror="this.src='assets/images/placeholder.jpg'">
    
    <div class="project-stats-modal">
      <div class="stat-item">
        <i class="fas fa-eye"></i>
        <span>${project.clicks} views</span>
      </div>
      <div class="stat-item">
        <i class="fas fa-heart"></i>
        <span>${project.likes} likes</span>
      </div>
    </div>

    <div class="modal-body">
      <h3>Description</h3>
      <p>${project.description}</p>
      
      <h3 style="margin-top: 20px;">Details</h3>
      <p>${project.details || "No additional details available."}</p>
    </div>

    <div class="modal-actions">
      <button class="use-project-btn" onclick="alert('Feature coming soon!')">
        <i class="fas fa-rocket"></i> Use This Project
      </button>
    </div>
  `;
  
  document.getElementById("project-modal").style.display = "block";
  document.body.classList.add('modal-open'); // Add this line
}

function closeModal() {
  document.getElementById("project-modal").style.display = "none";
  document.body.classList.remove('modal-open'); // Add this line
}

// Add this after the closeModal function
window.addEventListener('click', (e) => {
  const modal = document.getElementById('project-modal');
  if (e.target === modal) {
    closeModal();
  }
});
