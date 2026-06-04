document.addEventListener("DOMContentLoaded", () => {
  // --- 1. Fix the layout ---
  document
    .querySelector(".dashboard-layout")
    .classList.add("full-width-layout");

  // --- 2. Load the user's profile data ---
  loadUserProfile();

  // --- 3. DYNAMICALLY RE-BUILD HEADER LINKS ---
  const mainNav = document.querySelector(".main-nav");
  if (mainNav) {
    mainNav.innerHTML = ""; // Wipe all existing content

    const dashboardLink = document.createElement("a");
    dashboardLink.href = "dashboard.html";
    dashboardLink.textContent = "My Dashboard";

    const profileLink = document.createElement("a");
    profileLink.href = "my-profile.html";
    profileLink.textContent = "My Profile";
    profileLink.style.backgroundColor = "var(--secondary-color)"; // Active

    const logoutLink = document.createElement("a");
    logoutLink.href = "#";
    logoutLink.id = "logout-button";
    logoutLink.textContent = "Logout";

    mainNav.appendChild(dashboardLink);
    mainNav.appendChild(profileLink);
    mainNav.appendChild(logoutLink);
  }

  // --- 4. Handle Logout ---
  const logoutButton = document.getElementById("logout-button");
  if (logoutButton) {
    logoutButton.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("userRole");
      localStorage.removeItem("authToken");
      window.location.href = "../index.html";
    });
  }

  // --- 5. Handle Password Form ---
  const passwordForm = document.getElementById("change-password-form");
  const newPasswordInput = document.getElementById("new-password");
  const confirmPasswordInput = document.getElementById("confirm-password");
  const passMessageHolder = document.getElementById("password-message");

  if (passwordForm) {
    passwordForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const currentPassword = document.getElementById("current-password").value;
      const newPassword = newPasswordInput.value;
      const confirmPassword = confirmPasswordInput.value;

      if (newPassword !== confirmPassword) {
        showMessage(passMessageHolder, "New passwords do not match.", "red");
        return;
      }
      if (newPassword.length < 6) {
        showMessage(
          passMessageHolder,
          "Password must be at least 6 characters long.",
          "red"
        );
        return;
      }

      const token = localStorage.getItem("authToken");
      if (!token) {
        showMessage(passMessageHolder, "You are not logged in.", "red");
        return;
      }

      showMessage(
        passMessageHolder,
        "Updating password...",
        "var(--primary-color)"
      );

      try {
        const response = await fetch(
          "http://localhost:5000/api/auth/change-password",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              currentPassword: currentPassword,
              newPassword: newPassword,
            }),
          }
        );

        const result = await response.json();
        if (response.ok) {
          showMessage(
            passMessageHolder,
            "Password updated successfully!",
            "green"
          );
          setTimeout(() => {
            passwordForm.reset();
            showMessage(passMessageHolder, "", "green");
          }, 2000);
        } else {
          showMessage(passMessageHolder, result.message, "red");
        }
      } catch (err) {
        console.error("Password update error:", err);
        showMessage(passMessageHolder, "A network error occurred.", "red");
      }
    });
  }
});

// --- FUNCTION TO LOAD USER PROFILE ---
async function loadUserProfile() {
  const token = localStorage.getItem("authToken");
  if (!token) {
    window.location.href = "../index.html"; // Not logged in
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/auth/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Failed to fetch profile");
    const user = await response.json();

    // Populate the text spans
    document.getElementById("profile-name-text").textContent = user.fullname;
    document.getElementById("profile-email-text").textContent = user.email;
    document.getElementById("profile-phone-text").textContent =
      user.phone || "N/A";
    document.getElementById("profile-address-text").textContent =
      user.address || "N/A";
    document.getElementById("profile-role-text").textContent = user.user_role;

    // We have the data, NOW add listeners for the Edit/Save/Cancel buttons
    setupEditControls(user, token);
  } catch (err) {
    console.error("Error loading profile:", err);
    document.getElementById("profile-name-text").textContent =
      "Error loading data.";
  }
}

// --- FUNCTION TO SET UP EDIT/SAVE/CANCEL BUTTONS ---
function setupEditControls(user, token) {
  const profileBox = document.getElementById("profile-info-box");
  const editBtn = document.getElementById("edit-profile-btn");
  const saveBtn = document.getElementById("save-profile-btn");
  const cancelBtn = document.getElementById("cancel-edit-btn");
  const profileMessage = document.getElementById("profile-message");

  const nameInput = document.getElementById("profile-name-input");
  const emailInput = document.getElementById("profile-email-input");
  const phoneInput = document.getElementById("profile-phone-input");
  const addressInput = document.getElementById("profile-address-input");

  // --- Edit Button Click ---
  editBtn.addEventListener("click", () => {
    // Populate inputs with current data
    nameInput.value = user.fullname;
    emailInput.value = user.email;
    phoneInput.value = user.phone || "";
    addressInput.value = user.address || "";

    profileBox.classList.add("edit-mode");
    profileMessage.textContent = "";
  });

  // --- Cancel Button Click ---
  cancelBtn.addEventListener("click", () => {
    profileBox.classList.remove("edit-mode");
  });

  // --- Save Button Click (NOW REAL) ---
  saveBtn.addEventListener("click", async () => {
    showMessage(profileMessage, "Saving...", "var(--primary-color)");

    const updatedProfile = {
      fullname: nameInput.value,
      email: emailInput.value,
      phone: phoneInput.value,
      address: addressInput.value,
    };

    try {
      const response = await fetch("http://localhost:5000/api/auth/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedProfile),
      });

      const result = await response.json();

      if (response.ok) {
        // Update the local 'user' object with new data
        user = { ...user, ...result.user };

        // Update the text fields
        document.getElementById("profile-name-text").textContent =
          user.fullname;
        document.getElementById("profile-email-text").textContent = user.email;
        document.getElementById("profile-phone-text").textContent =
          user.phone || "N/A";
        document.getElementById("profile-address-text").textContent =
          user.address || "N/A";

        showMessage(profileMessage, "Profile updated successfully!", "green");
        profileBox.classList.remove("edit-mode");
      } else {
        showMessage(profileMessage, `Error: ${result.message}`, "red");
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      showMessage(profileMessage, "A network error occurred.", "red");
    }
  });
}

// --- Helper for showing messages ---
function showMessage(element, message, color) {
  if (element) {
    element.textContent = message;
    element.style.color = color;
  }
}
