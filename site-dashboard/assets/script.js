let userLoggedIn = false; // Replace this with actual user login status
let userName = "Mohan Lu"; // Replace with actual user name
let userRole = "Seller"; // Or 'Seller', 'Buyer', etc.
let userProfileImage =
  "https://banner2.cleanpng.com/20180324/whq/av077g98s.webp"; // Set to null for no image

function toggleSidebar() {
  const sidebar = document.querySelector(".sidebar");
  const mainContent = document.querySelector(".main-content");
  const header = document.querySelector(".header");

  // On mobile, treat it as a drawer
  if (window.innerWidth <= 768) {
    sidebar.classList.toggle("show");
  } else {
    // On desktop, collapse
    sidebar.classList.toggle("collapsed");
    mainContent.classList.toggle("collapsed");
    header.classList.toggle("collapsed");
  }
}

function toggleTheme() {
  document.documentElement.classList.toggle("dark");

  // Smoothly rotate the icon
  const icon = document.querySelector(".theme-toggle i");
  icon.classList.add("switching");
  // Toggle classes for moon/sun
  if (icon.classList.contains("fa-moon")) {
    icon.classList.remove("fa-moon");
    icon.classList.add("fa-sun");
  } else {
    icon.classList.remove("fa-sun");
    icon.classList.add("fa-moon");
  }
  // After rotation ends, remove 'switching' so it can rotate again next time
  setTimeout(() => {
    icon.classList.remove("switching");
  }, 800); // matches CSS transition time
}

function toggleNotifications() {
  // Close profile menu if open
  document.querySelector(".profile-menu").classList.remove("show");
  // Toggle notifications popup
  document.querySelector(".notifications-popup").classList.toggle("show");
}

function toggleProfile() {
  // Show/hide profile menu when clicked
  const profileMenu = document.querySelector(".profile-menu");
  profileMenu.classList.toggle("show");
}

// Update profile info dynamically
const profileImageElement = document.getElementById("profile-image");
const userNameElement = document.getElementById("user-name");
const userRoleElement = document.getElementById("user-role");
const loginRegisterLink = document.getElementById("login-register");
const settingsLink = document.getElementById("settings-link");
const logoutLink = document.getElementById("logout-link");

// Set the profile image, username, and role
profileImageElement.src =
  userProfileImage || "https://path/to/default/profile/icon.png";
userNameElement.textContent = userName || "Guest";
userRoleElement.textContent = userRole || "Not logged in";

// Show/hide the profile menu items based on login status
if (userLoggedIn) {
  loginRegisterLink.style.display = "none"; // Hide Login/Register link
  settingsLink.style.display = "block"; // Show Settings link
  logoutLink.style.display = "block"; // Show Logout link
} else {
  loginRegisterLink.style.display = "block"; // Show Login/Register link
  settingsLink.style.display = "none"; // Hide Settings link
  logoutLink.style.display = "none"; // Hide Logout link
}

// Close popups when clicking outside
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

// Start in collapsed mode on smaller screens
if (window.innerWidth <= 768) {
  document.querySelector(".sidebar").classList.add("collapsed");
  document.querySelector(".main-content").classList.add("collapsed");
  document.querySelector(".header").classList.add("collapsed");
}
