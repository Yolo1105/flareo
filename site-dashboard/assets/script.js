let userLoggedIn = false;
let userName = "Mohan Lu";
let userRole = "Seller";
let userProfileImage =
  "https://banner2.cleanpng.com/20180324/whq/av077g98s.webp";

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

const profileImageElement = document.getElementById("profile-image");
const userNameElement = document.getElementById("user-name");
const userRoleElement = document.getElementById("user-role");
const loginRegisterLink = document.getElementById("login-register");
const settingsLink = document.getElementById("settings-link");
const logoutLink = document.getElementById("logout-link");

profileImageElement.src =
  userProfileImage || "https://path/to/default/profile/icon.png";
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
