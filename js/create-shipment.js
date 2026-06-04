document.addEventListener("DOMContentLoaded", () => {
  // --- THIS IS THE FIX ---
  document
    .querySelector(".dashboard-layout")
    .classList.add("full-width-layout");

  // --- 1. GET ROLE AND AUTO-FILL HIDDEN FIELD ---
  const userRole = localStorage.getItem("userRole");
  const hiddenRoleInput = document.getElementById("user-role");

  if (hiddenRoleInput) {
    hiddenRoleInput.value = userRole;
  }

  // --- 2. DYNAMICALLY RE-BUILD HEADER LINKS ---
  const mainNav = document.querySelector(".main-nav");
  if (mainNav) {
    mainNav.innerHTML = "";

    const dashboardLink = document.createElement("a");
    dashboardLink.href = "dashboard.html";
    dashboardLink.textContent = "My Dashboard";

    const profileLink = document.createElement("a");
    profileLink.href = "my-profile.html";
    profileLink.textContent = "My Profile";

    const logoutLink = document.createElement("a");
    logoutLink.href = "#";
    logoutLink.id = "logout-button";
    logoutLink.textContent = "Logout";

    mainNav.appendChild(dashboardLink);
    mainNav.appendChild(profileLink);
    mainNav.appendChild(logoutLink);
  }

  // --- 3. Handle Logout (finds the new button) ---
  const logoutButton = document.getElementById("logout-button");
  if (logoutButton) {
    logoutButton.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("userRole");
      window.location.href = "../index.html";
    });
  }

  // ... (Keep all the code at the top of the file, from line 1 to 46)

  // --- 4. Handle Form Submission (Mock) ---
  const shipmentForm = document.getElementById("create-shipment-form");
  const messageHolder = document.getElementById("form-message");

  if (shipmentForm) {
    shipmentForm.addEventListener("submit", async (e) => {
      // <-- Made this async
      e.preventDefault();

      messageHolder.textContent = "Submitting your request...";
      messageHolder.style.color = "var(--primary-color)";

      // Get the token to prove we're logged in
      const token = localStorage.getItem("authToken");
      if (!token) {
        messageHolder.textContent =
          "Error: You are not logged in. Redirecting...";
        messageHolder.style.color = "red";
        setTimeout(() => {
          window.location.href = "../index.html";
        }, 2500);
        return;
      }

      const formData = new FormData(shipmentForm);
      const data = Object.fromEntries(formData.entries());

      try {
        const response = await fetch("http://localhost:5000/api/shipments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Send the token
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok) {
          messageHolder.textContent = `Shipment created! Tracking ID: ${result.trackingId}. Redirecting...`;
          messageHolder.style.color = "green";
          setTimeout(() => {
            window.location.href = "dashboard.html";
          }, 3000);
        } else {
          messageHolder.textContent = `Error: ${result.message}`;
          messageHolder.style.color = "red";
        }
      } catch (err) {
        console.error("Shipment creation error:", err);
        messageHolder.textContent =
          "A network error occurred. Please try again.";
        messageHolder.style.color = "red";
      }
    });
  }
});
