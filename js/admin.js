/*
  =================================================
  THIS SCRIPT RUNS ON ALL ADMIN-ONLY PAGES
  (e.g., shipments, users, reports, profile)
  =================================================
*/
document.addEventListener("DOMContentLoaded", () => {
  const userRole = localStorage.getItem("userRole");
  const logoutButton = document.getElementById("logout-button");

  // --- 1. Handle Logout ---
  if (logoutButton) {
    logoutButton.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("userRole");
      window.location.href = "../index.html"; // Go up one level
    });
  }

  // --- 2. Check Role ---
  if (userRole === "admin") {
    // *** NEW ANIMATION LOGIC ***
    const adminSidebar = document.getElementById("admin-sidebar");
    if (adminSidebar) {
      // Check if animation has already run in this session
      if (sessionStorage.getItem("sidebarAnimated") === "true") {
        // --- 1. ALREADY ANIMATED: SHOW INSTANTLY ---
        const layout = document.querySelector(".dashboard-layout");
        adminSidebar.classList.add("no-transition");
        layout.classList.add("no-transition");

        layout.style.gridTemplateColumns = "250px 1fr";
        adminSidebar.style.transform = "translateX(0)";

        setTimeout(() => {
          adminSidebar.classList.remove("no-transition");
          layout.classList.remove("no-transition");
        }, 50);
      } else {
        // --- 2. FIRST TIME: RUN ANIMATION & SET FLAG *AFTER* ---
        setTimeout(() => {
          document.querySelector(
            ".dashboard-layout"
          ).style.gridTemplateColumns = "250px 1fr";
          adminSidebar.style.transform = "translateX(0)";
        }, 1);

        // --- THIS IS THE FIX ---
        // Set the flag *after* the animation (400ms) has finished
        setTimeout(() => {
          sessionStorage.setItem("sidebarAnimated", "true");
        }, 500);
      }
    }
  } else {
    // --- 3. USER IS NOT ADMIN ---
    const adminSidebar = document.getElementById("admin-sidebar");
    if (adminSidebar) {
      const mainContent = document.querySelector(".dashboard-main-content");
      if (mainContent) {
        mainContent.innerHTML =
          "<h2>Access Denied</h2><p>You do not have permission to view this page. Redirecting...</p>";
        mainContent.style.color = "red";
      }

      setTimeout(() => {
        if (userRole) {
          window.location.href = "dashboard.html";
        } else {
          window.location.href = "../index.html";
        }
      }, 2000);
    }
  }
});
