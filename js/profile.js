document.addEventListener("DOMContentLoaded", () => {
  // This script only runs if the user is an admin
  if (localStorage.getItem("userRole") !== "admin") {
    return;
  }

  // --- 1. Load Profile Data ---
  loadAdminProfile();

  // --- 2. Get Page Elements for Password Form ---
  const passwordForm = document.getElementById("change-password-form");
  const newPasswordInput = document.getElementById("new-password");
  const confirmPasswordInput = document.getElementById("confirm-password");
  const messageHolder = document.getElementById("password-message");

  // --- 3. Add Password Form Submit Listener ---
  if (passwordForm) {
    passwordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const currentPassword = document.getElementById("current-password").value;
      const newPassword = newPasswordInput.value;
      const confirmPassword = confirmPasswordInput.value;

      if (newPassword !== confirmPassword) {
        showMessage("New passwords do not match. Please try again.", "red");
        return;
      }
      if (newPassword.length < 6) {
        showMessage("Password must be at least 6 characters long.", "red");
        return;
      }

      const token = localStorage.getItem("authToken");
      if (!token) {
        showMessage("You are not logged in.", "red");
        return;
      }

      showMessage("Updating password...", "var(--primary-color)");

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
          showMessage("Password updated successfully!", "green");
          setTimeout(() => {
            passwordForm.reset();
            showMessage("", "green");
          }, 2000);
        } else {
          showMessage(result.message, "red");
        }
      } catch (err) {
        console.error("Password update error:", err);
        showMessage("A network error occurred. Please try again.", "red");
      }
    });
  }

  function showMessage(message, color) {
    if (messageHolder) {
      messageHolder.textContent = message;
      messageHolder.style.color = color;
    }
  }
});

// --- NEW FUNCTION TO LOAD PROFILE DATA ---
async function loadAdminProfile() {
  const token = localStorage.getItem("authToken");
  if (!token) return;

  try {
    const response = await fetch("http://localhost:5000/api/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch profile");
    }

    const user = await response.json();

    // Populate the static fields in admin/profile.html
    document.getElementById("profile-name").textContent = user.fullname;
    document.getElementById("profile-email").textContent = user.email;
    document.getElementById("profile-role").textContent = user.user_role;
  } catch (err) {
    console.error("Error loading profile:", err);
    document.getElementById("profile-name").textContent = "Error loading";
  }
}
