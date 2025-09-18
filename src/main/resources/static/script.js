// API Configuration
const API_BASE_URL = "http://localhost:8080/api"

// Global State
let currentUser = null
let currentItems = []
const currentFilter = "all"

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  console.log("[v0] DOM loaded, initializing app")
  initializeApp()
  setupEventListeners()
  testBackendConnection()
})

async function testBackendConnection() {
  try {
    console.log("[v0] Testing backend connection...")
    const response = await fetch(`${API_BASE_URL}/items/all`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (response.ok) {
      console.log("[v0] Backend connection successful")
      showToast("Connected to server", "success")
    } else {
      console.log("[v0] Backend responded with error:", response.status)
      showToast("Server connection issues detected", "warning")
    }
  } catch (error) {
    console.error("[v0] Backend connection failed:", error)
    showToast("Cannot connect to server. Please ensure backend is running on localhost:8080", "error")
  }
}

function initializeApp() {
  // Check if user is logged in
  const token = localStorage.getItem("authToken")
  const userData = localStorage.getItem("userData")

  if (token && userData) {
    currentUser = JSON.parse(userData)
    showApp()
    showPage("home")
    loadHomeStats()
  } else {
    showAuth()
    showLogin()
  }
}

function setupEventListeners() {
  // Auth Forms
  document.getElementById("login-form").addEventListener("submit", handleLogin)
  document.getElementById("signup-form").addEventListener("submit", handleSignup)
  document.getElementById("report-form").addEventListener("submit", handleReportItem)
  document.getElementById("profile-form").addEventListener("submit", handleUpdateProfile)
  document.getElementById("password-form").addEventListener("submit", handleChangePassword)

  // Navigation Toggle
  document.getElementById("nav-toggle").addEventListener("click", toggleNavMenu)

  // Search Input
  const searchInput = document.getElementById("search-input")
  if (searchInput) {
    searchInput.addEventListener("input", debouncedSearch)
  }
}

// Authentication Functions
async function handleLogin(e) {
  e.preventDefault()
  showLoading(true)

  const loginData = {
    email: document.getElementById("login-email").value,
    password: document.getElementById("login-password").value,
  }

  console.log("[v0] Attempting login for email:", loginData.email)

  try {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(loginData),
    })

    console.log("[v0] Login response status:", response.status)

    if (response.ok) {
      const contentType = response.headers.get("content-type")
      let data

      if (contentType && contentType.includes("application/json")) {
        data = await response.json()
      } else {
        const textResponse = await response.text()
        try {
          data = JSON.parse(textResponse)
        } catch {
          data = {
            email: loginData.email,
            message: textResponse,
          }
        }
      }

      console.log("[v0] Login successful, user data:", data)

      localStorage.setItem("authToken", "dummy-token") // Backend doesn't return token
      localStorage.setItem("userData", JSON.stringify(data))
      currentUser = data

      showToast("Login successful!", "success")
      showApp()
      showPage("home")
      loadHomeStats()
    } else {
      const error = await response.text()
      console.error("[v0] Login failed with error:", error)
      showToast(error || "Login failed", "error")
    }
  } catch (error) {
    console.error("[v0] Login network error:", error)
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      showToast("Cannot connect to server. Please ensure backend is running on localhost:8080", "error")
    } else {
      showToast(`Network error: ${error.message}`, "error")
    }
  }

  showLoading(false)
}

async function handleSignup(e) {
  e.preventDefault()
  showLoading(true)

  const userData = {
    firstName: document.getElementById("signup-firstname").value,
    lastName: document.getElementById("signup-lastname").value,
    username: document.getElementById("signup-username").value,
    email: document.getElementById("signup-email").value,
    password: document.getElementById("signup-password").value,
    dateOfBirth: document.getElementById("signup-dob").value,
    gender: document.getElementById("signup-gender").value,
  }

  console.log("[v0] Attempting signup for user:", userData.email)
  console.log("[v0] Signup data being sent:", userData)

  try {
    const response = await fetch(`${API_BASE_URL}/users/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(userData),
    })

    console.log("[v0] Signup response status:", response.status)

    let result
    const contentType = response.headers.get("content-type")

    if (contentType && contentType.includes("application/json")) {
      result = await response.json()
      console.log("[v0] Signup JSON response:", result)
    } else {
      result = await response.text()
      console.log("[v0] Signup text response:", result)
    }

    if (response.ok) {
      console.log("[v0] Signup successful")
      showToast("Account created successfully! Please login.", "success")
      showLogin()
      document.getElementById("signup-form").reset()
    } else {
      const errorMessage = typeof result === "object" ? result.message || result.error || "Signup failed" : result
      console.error("[v0] Signup failed:", errorMessage)
      showToast(errorMessage, "error")
    }
  } catch (error) {
    console.error("[v0] Signup network error:", error)
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      showToast("Cannot connect to server. Please ensure your backend is running on localhost:8080", "error")
    } else if (error.name === "SyntaxError") {
      showToast("Server returned invalid response. Please check backend logs.", "error")
    } else {
      showToast(`Network error: ${error.message}`, "error")
    }
  }

  showLoading(false)
}

function logout() {
  localStorage.removeItem("authToken")
  localStorage.removeItem("userData")
  currentUser = null
  showAuth()
  showLogin()
  showToast("Logged out successfully", "success")
}

// Navigation Functions
function showAuth() {
  document.getElementById("auth-container").style.display = "flex"
  document.getElementById("app-container").style.display = "none"
}

function showApp() {
  document.getElementById("auth-container").style.display = "none"
  document.getElementById("app-container").style.display = "block"
}

function showLogin() {
  document.getElementById("login-page").classList.add("active")
  document.getElementById("signup-page").classList.remove("active")
}

function showSignup() {
  document.getElementById("signup-page").classList.add("active")
  document.getElementById("login-page").classList.remove("active")
}

function showPage(pageName) {
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.remove("active")
  })

  document.getElementById(`${pageName}-page`).classList.add("active")

  switch (pageName) {
    case "home":
      loadHomeStats()
      break
    case "browse":
      loadItems()
      break
    case "dashboard":
      loadDashboard()
      break
    case "profile":
      loadProfile()
      break
  }
}

function toggleNavMenu() {
  const navMenu = document.getElementById("nav-menu")
  navMenu.classList.toggle("active")
}

// Data Loading Functions
async function loadHomeStats() {
  try {
    console.log("[v0] Loading home stats...")
    const response = await fetch(`${API_BASE_URL}/items/all`, {
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (response.ok) {
      const items = await response.json()
      console.log("[v0] Loaded items for stats:", items.length)

      const lostCount = items.filter((item) => item.status === "LOST").length
      const foundCount = items.filter((item) => item.status === "FOUND").length
      const claimedCount = items.filter((item) => item.status === "CLAIMED").length

      document.getElementById("total-lost").textContent = lostCount
      document.getElementById("total-found").textContent = foundCount
      document.getElementById("total-claimed").textContent = claimedCount
    } else {
      console.error("[v0] Failed to load home stats:", response.status)
    }
  } catch (error) {
    console.error("[v0] Error loading home stats:", error)
  }
}

async function loadItems(status = "all") {
  showLoading(true)
  console.log("[v0] Loading items with status:", status)

  try {
    let url = `${API_BASE_URL}/items/all`
    if (status !== "all") {
      url = `${API_BASE_URL}/items/${status.toLowerCase()}`
    }

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (response.ok) {
      currentItems = await response.json()
      console.log("[v0] Loaded items:", currentItems.length)
      displayItems(currentItems)
    } else {
      console.error("[v0] Failed to load items:", response.status)
      showToast("Failed to load items", "error")
    }
  } catch (error) {
    console.error("[v0] Error loading items:", error)
    showToast("Network error loading items", "error")
  }

  showLoading(false)
}

async function loadDashboard() {
  if (!currentUser) return

  showLoading(true)
  console.log("[v0] Loading dashboard for user:", currentUser.userId)

  try {
    const response = await fetch(`${API_BASE_URL}/users/${currentUser.userId}/dashboard`, {
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (response.ok) {
      const dashboardData = await response.json()
      console.log("[v0] Dashboard data loaded:", dashboardData)

      document.getElementById("dashboard-welcome").textContent = `Welcome back, ${dashboardData.fullName}!`
      document.getElementById("user-lost-count").textContent = dashboardData.lostCount
      document.getElementById("user-found-count").textContent = dashboardData.foundCount
      document.getElementById("user-claimed-count").textContent = dashboardData.claimedCount

      displayRecentItems(dashboardData.recentItems)
    } else {
      console.error("[v0] Failed to load dashboard:", response.status)
    }
  } catch (error) {
    console.error("[v0] Error loading dashboard:", error)
    showToast("Failed to load dashboard", "error")
  }

  showLoading(false)
}

function displayRecentItems(items) {
  const recentItemsList = document.getElementById("recent-items-list")

  if (items.length === 0) {
    recentItemsList.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>No recent items</p>
            </div>
        `
    return
  }

  recentItemsList.innerHTML = items
    .map(
      (item) => `
        <div class="recent-item">
            <div class="recent-item-info">
                <h4>${item.itemName}</h4>
                <p>${item.itemType} • ${item.status} • ${formatDate(item.dateReported)}</p>
            </div>
            <span class="item-status status-${item.status.toLowerCase()}">${item.status}</span>
        </div>
    `,
    )
    .join("")
}

function loadProfile() {
  if (!currentUser) return

  document.getElementById("profile-firstname").value = currentUser.firstName || ""
  document.getElementById("profile-lastname").value = currentUser.lastName || ""
  document.getElementById("profile-username").value = currentUser.username || ""
  document.getElementById("profile-email").value = currentUser.email || ""
  document.getElementById("profile-dob").value = currentUser.dateOfBirth || ""
  document.getElementById("profile-gender").value = currentUser.gender || ""

  if (currentUser.profilePicture) {
    document.getElementById("profile-avatar").src = `data:image/jpeg;base64,${currentUser.profilePicture}`
  }
}

// Item Functions
// ... existing code ...
// <CHANGE> send flat imageBase64 instead of nested itemImage object (pure JS)
async function handleReportItem(e) {
  e.preventDefault();
  showLoading(true);

  try {
    if (!currentUser || !currentUser.userId) {
      showToast("Please login first!", "error");
      return;
    }

    // Read the hidden input populated by handleUpload (do not change handleUpload)
    var imageInput = document.getElementById("item-image-data");
    var imageBase64 = null;

    if (imageInput && imageInput.value) {
      try {
        var imgData = JSON.parse(imageInput.value);
        imageBase64 = (imgData && imgData.base64) ? imgData.base64 : null; // send only the base64 string
      } catch (err) {
        imageBase64 = null;
      }
    }

    var itemData = {
      userId: currentUser.userId, // must match backend DTO
      itemName: (document.getElementById("item-name") || {}).value || "",
      itemType: (document.getElementById("item-type") || {}).value || "",
      description: (document.getElementById("item-description") || {}).value || "",
      location: (document.getElementById("item-location") || {}).value || "",
      status: (document.getElementById("item-status") || {}).value || "LOST",
      imageBase64: imageBase64, // flat base64 expected by backend
    };

    // Optional debug (trim base64 to avoid huge logs)
    // console.log("[v0] Reporting item payload:", Object.assign({}, itemData, { imageBase64: imageBase64 ? imageBase64.slice(0, 32) + "..." : null }));

    var resp = await fetch(API_BASE_URL + "/items/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(itemData),
    });

    if (!resp.ok) {
      var msg = await resp.text();
      showToast(msg || "Failed to report item", "error");
      return;
    }

    showToast("Item reported successfully!", "success");
    var form = document.getElementById("report-form");
    if (form && typeof form.reset === "function") form.reset();
    var preview = document.getElementById("image-preview");
    if (preview) preview.innerHTML = "";
    showPage("browse");
    loadItems("all");
  } catch (err) {
    console.error("[v0] Error reporting item:", err);
    showToast("Network error. Please try again.", "error");
  } finally {
    showLoading(false);
  }
}
// ... existing code ...
async function claimItem(itemId) {
  if (!confirm("Are you sure you want to claim this item?")) return

  showLoading(true)
  console.log("[v0] Claiming item:", itemId)

  try {
    const response = await fetch(`${API_BASE_URL}/items/${itemId}/claim`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (response.ok) {
      console.log("[v0] Item claimed successfully")
      showToast("Item claimed successfully!", "success")
      loadItems(currentFilter)
    } else {
      console.error("[v0] Failed to claim item:", response.status)
      showToast("Failed to claim item", "error")
    }
  } catch (error) {
    console.error("[v0] Error claiming item:", error)
    showToast("Network error. Please try again.", "error")
  }

  showLoading(false)
}

function viewItemDetails(itemId) {
  const item = currentItems.find((i) => i.id === itemId)
  if (item) {
    alert(
      `Item: ${item.itemName}\nType: ${item.itemType}\nDescription: ${item.description}\nLocation: ${item.location}\nStatus: ${item.status}\nReported: ${formatDate(item.dateReported)}`,
    )
  }
}

// Profile Functions
async function handleUpdateProfile(e) {
  e.preventDefault()
  showLoading(true)

  const updatedData = {
    firstName: document.getElementById("profile-firstname").value,
    lastName: document.getElementById("profile-lastname").value,
    username: document.getElementById("profile-username").value,
    email: document.getElementById("profile-email").value,
    dateOfBirth: document.getElementById("profile-dob").value,
    gender: document.getElementById("profile-gender").value,
    profilePicture: currentUser.profilePicture,
  }

  console.log("[v0] Updating profile for user:", currentUser.username)

  try {
    const response = await fetch(`${API_BASE_URL}/users/${currentUser.username}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedData),
    })

    const result = await response.text()
    console.log("[v0] Profile update response:", result)

    if (response.ok && result.includes("successfully")) {
      currentUser = { ...currentUser, ...updatedData }
      localStorage.setItem("userData", JSON.stringify(currentUser))

      console.log("[v0] Profile updated successfully")
      showToast("Profile updated successfully!", "success")
    } else {
      console.error("[v0] Profile update failed:", result)
      showToast(result || "Failed to update profile", "error")
    }
  } catch (error) {
    console.error("[v0] Error updating profile:", error)
    showToast("Network error. Please try again.", "error")
  }

  showLoading(false)
}

async function handleChangePassword(e) {
  e.preventDefault()

  const currentPassword = document.getElementById("current-password").value
  const newPassword = document.getElementById("new-password").value
  const confirmPassword = document.getElementById("confirm-password").value

  if (newPassword !== confirmPassword) {
    showToast("New passwords do not match", "error")
    return
  }

  if (newPassword.length < 6) {
    showToast("Password must be at least 6 characters long", "error")
    return
  }

  showLoading(true)
  console.log("[v0] Changing password for user:", currentUser.username)

  try {
    const response = await fetch(`${API_BASE_URL}/users/${currentUser.username}/change-password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    })

    if (response.ok) {
      console.log("[v0] Password changed successfully")
      showToast("Password changed successfully!", "success")
      document.getElementById("password-form").reset()
    } else {
      const error = await response.text()
      console.error("[v0] Password change failed:", error)
      showToast(error || "Failed to change password", "error")
    }
  } catch (error) {
    console.error("[v0] Error changing password:", error)
    showToast("Network error. Please try again.", "error")
  }

  showLoading(false)
}
// Fetch Lost items
async function getLostItems() {
  const response = await fetch("http://localhost:8080/api/items/lost");
  const items = await response.json();
  displayItems(items);
}

// Fetch Found items
async function getFoundItems() {
  const response = await fetch("http://localhost:8080/api/items/found");
  const items = await response.json();
  displayItems(items);
}

// Fetch Claimed items
async function getClaimedItems() {
  const response = await fetch("http://localhost:8080/api/items/claimed");
  const items = await response.json();
  displayItems(items);
}

// Fetch All items
async function getAllItems() {
  const response = await fetch("http://localhost:8080/api/items/all");
  const items = await response.json();
  displayItems(items);
}

// Image Handling Functions
function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const base64Data = e.target.result.split(",")[1];
    const fileType = file.type; // e.g., "image/jpeg"

    let hiddenInput = document.getElementById("item-image-data");
    if (!hiddenInput) {
      hiddenInput = document.createElement("input");
      hiddenInput.type = "hidden";
      hiddenInput.id = "item-image-data";
      document.getElementById("report-form").appendChild(hiddenInput);
    }
    // ✅ Store a JSON string with both the base64 data and the file type
    hiddenInput.value = JSON.stringify({
      base64: base64Data,
      type: fileType
    });

    const preview = document.getElementById("image-preview");
    preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
  };
  reader.readAsDataURL(file);
}

function handleAvatarUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    document.getElementById("profile-avatar").src = e.target.result

    updateProfilePicture(e.target.result.split(",")[1])
  }
  reader.readAsDataURL(file)
}

async function updateProfilePicture(base64Data) {
  console.log("[v0] Updating profile picture")

  try {
    const response = await fetch(`${API_BASE_URL}/users/${currentUser.username}/profile-picture`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ profilePicture: base64Data }),
    })

    if (response.ok) {
      currentUser.profilePicture = base64Data
      localStorage.setItem("userData", JSON.stringify(currentUser))
      console.log("[v0] Profile picture updated successfully")
      showToast("Profile picture updated!", "success")
    } else {
      console.error("[v0] Failed to update profile picture:", response.status)
      showToast("Failed to update profile picture", "error")
    }
  } catch (error) {
    console.error("[v0] Error updating profile picture:", error)
    showToast("Network error updating profile picture", "error")
  }
}

// Utility Functions
function showLoading(show) {
  document.getElementById("loading").style.display = show ? "flex" : "none"
}

function showToast(message, type = "info") {
  const toast = document.createElement("div")
  toast.className = `toast ${type}`
  // toast.innerHTML = `
  //       <div style="display: flex; align-items: center; gap: 0.5rem;">
  //           <i class="fas fa-${getToastIcon(type)}"></i>
  //           <span>${message}</span>11
  //       </div>
  //   `
  toast.innerHTML = `
  <div style="display: flex; align-items: center; gap: 0.5rem;">
    <i class="fas fa-${getToastIcon(type)}"></i>
    <span>${message}</span>
  </div>
`


  document.getElementById("toast-container").appendChild(toast)

  setTimeout(() => {
    toast.remove()
  }, 5000)
}

function getToastIcon(type) {
  switch (type) {
    case "success":
      return "check-circle"
    case "error":
      return "exclamation-circle"
    case "warning":
      return "exclamation-triangle"
    default:
      return "info-circle"
  }
}

function formatDate(dateString) {
  if (!dateString) return "Unknown"

  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`

  return date.toLocaleDateString()
}

// Debounce function for search
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

const debouncedSearch = debounce(searchItems, 300)

// function displayItems(items) {
//   const itemList = document.getElementById("items-grid"); // ✅ match HTML

//   if (!itemList) {
//     console.error("❌ No element with id 'items-grid' found in HTML");
//     return;
//   }

//   if (items.length === 0) {
//     itemList.innerHTML = `
//       <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
//         <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 1rem;"></i>
//         <p>No items found</p>
//       </div>`;
//     return;
//   }

//   itemList.innerHTML = items.map(item => `
//     <div class="item-card">
//       <h3>${item.itemName}</h3>
//       <p>${item.description}</p>
//       <p><b>Status:</b> ${item.status}</p>
//       <p><b>Location:</b> ${item.location}</p>
//     </div>
//   `).join("");
// }
// ... existing code ...
// <CHANGE> display image from itemImageBase64 OR itemImage (base64 or URL)
function displayItems(items) {
  const itemList = document.getElementById("items-grid");
  if (!itemList) {
    console.error("No element with id 'items-grid' found in the HTML.");
    return;
  }

  if (!items || items.length === 0) {
    itemList.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
        <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 1rem;"></i>
        <p>No items found</p>
      </div>`;
    return;
  }

  itemList.innerHTML = items.map((item) => {
    var src = buildImageSrc(item);
    return `
      <div class="item-card">
        ${
          src
            ? `<img src="${src}" class="item-image" alt="${item.itemName || "Item"}">`
            : '<div class="item-image placeholder">No Image</div>'
        }
        <div class="item-info">
          <h3 class="item-name">${item.itemName || ""}</h3>
          <p class="item-location"><i class="fas fa-map-marker-alt"></i> ${item.location || ""}</p>
          <span class="item-status status-${(item.status || "").toLowerCase()}">${item.status || ""}</span>
        </div>
      </div>
    `;
  }).join("");
}
// ... existing code ...
// Assuming currentUser is set after login and contains the full user object
// Example: currentUser = { userId: "68a9e84db05b548477f72e0c", firstName: "Manasa", ... }
// Correct handleReportItem
// async function handleReportItem(e) {
//   e.preventDefault();
//   if (!currentUser || !currentUser.userId) {
//     console.error("User not logged in or missing userId!");
//     showToast("Please login first!", "error");
//     return;
//   }

//   // get image from hidden input
//   const imageInput = document.getElementById("item-image-data");
//   let itemImage = null;
//   if (imageInput && imageInput.value) {
//     const imgData = JSON.parse(imageInput.value);
//     itemImage = { base64: imgData.base64, type: imgData.type };
//   }

//   const itemData = {
//     userId: currentUser.userId,
//     itemName: document.getElementById("item-name").value,
//     itemType: document.getElementById("item-type").value,
//     description: document.getElementById("item-description").value,
//     location: document.getElementById("item-location").value,
//     status: document.getElementById("item-status").value,
//     itemImage: itemImage, // send both base64 and type
//   };

//   console.log("[handleReportItem] Sending:", itemData);

//   try {
//     const response = await fetch(`${API_BASE_URL}/items/report`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(itemData),
//     });

//     if (response.ok) {
//       showToast("Item reported successfully!", "success");
//       document.getElementById("report-form").reset();
//       document.getElementById("image-preview").innerHTML = "";
//       fetchItems("all"); // reload items including the new one
//       showPage("browse");
//     } else {
//       const error = await response.text();
//       console.error("Failed to report item:", error);
//       showToast(error || "Failed to report item", "error");
//     }
//   } catch (err) {
//     console.error("Network error reporting item:", err);
//     showToast("Network error. Please try again.", "error");
//   }
// }

// <CHANGE> JS version: send a flat imageBase64 (strip any data URL prefix)
// <CHANGE> JS: send flat imageBase64 (no data URL prefix)
function extractBase64(str) {
  if (!str) return null;
  var i = str.indexOf(",");
  return i >= 0 ? str.slice(i + 1) : str;
}

async function handleReportItem(e) {
  e.preventDefault();
  showLoading(true);

  try {
    if (!currentUser || !currentUser.userId) {
      showToast("Please login first!", "error");
      return;
    }

    var imageInput = document.getElementById("item-image-data");
    var imageBase64 = null;

    if (imageInput && imageInput.value) {
      try {
        var imgData = JSON.parse(imageInput.value);
        var raw = (imgData && (imgData.base64 || imgData.dataUrl || imgData.dataURL)) || null;
        imageBase64 = extractBase64(raw);
      } catch (_) {
        imageBase64 = null;
      }
    }

    var body = {
      userId: currentUser.userId,
      itemName: (document.getElementById("item-name") || {}).value || "",
      itemType: (document.getElementById("item-type") || {}).value || "",
      description: (document.getElementById("item-description") || {}).value || "",
      location: (document.getElementById("item-location") || {}).value || "",
      status: ((document.getElementById("item-status") || {}).value || "LOST").toUpperCase(),
      imageBase64: imageBase64
    };

    var resp = await fetch(API_BASE_URL + "/items/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      var msg = await resp.text();
      showToast(msg || "Failed to report item", "error");
      return;
    }

    showToast("Item reported successfully!", "success");
    var form = document.getElementById("report-form");
    if (form && typeof form.reset === "function") form.reset();
    var preview = document.getElementById("image-preview");
    if (preview) preview.innerHTML = "";
    showPage("browse");
    loadItems("all");
  } catch (err) {
    console.error("[v0] Error reporting item:", err);
    showToast("Network error. Please try again.", "error");
  } finally {
    showLoading(false);
  }
}
// <CHANGE> build a valid src whether backend returns base64, data URL, or HTTP URL
function buildImageSrc(item) {
  var val = (item && (item.itemImageBase64 || item.itemImage || item.imageUrl)) || null;
  if (!val) return null;

  // If server already returns a full URL or data URL, use it as-is
  if (typeof val === "string" && (val.startsWith("http://") || val.startsWith("https://") || val.startsWith("data:"))) {
    return val;
  }

  // Otherwise assume it's raw base64 and prefix as JPEG
  return "data:image/jpeg;base64," + val.trim();
}
// ✅ Wrapper for button clicks
function filterByStatus(status) {
  console.log("Filtering by status:", status);
  loadItems(status);
}
async function searchItems() {
  const query = document.getElementById("search-input").value.trim();
  const type = document.getElementById("filter-select")?.value || "";
  const location = document.getElementById("location-input")?.value.trim() || "";
  const status = document.getElementById("status-select")?.value || "";
  const date = document.getElementById("date-input")?.value || "";

  let url = `${API_BASE_URL}/items/search?`;

  if (query) url += `itemName=${encodeURIComponent(query)}&`;
  if (type && type !== "All") url += `itemType=${encodeURIComponent(type)}&`;
  if (location) url += `location=${encodeURIComponent(location)}&`;
  if (status && status !== "All") url += `status=${encodeURIComponent(status)}&`;
  if (date) url += `dateReported=${encodeURIComponent(date)}&`;

  url = url.replace(/&$/, ""); // remove trailing &

  console.log("[v1] Search URL:", url);

  try {
    const response = await fetch(url, {
      headers: { "Content-Type": "application/json" }
    });
    if (!response.ok) throw new Error("Search failed with status " + response.status);

    const items = await response.json();
    console.log("[v1] Search results:", items);
    displayItems(items);
  } catch (err) {
    console.error("[v1] Error searching items:", err);
    showToast("Error performing search", "error");
  }
}
