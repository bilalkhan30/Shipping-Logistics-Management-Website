document.addEventListener("DOMContentLoaded", () => {
  // Only try to populate the table if the user is an admin
  const userRole = localStorage.getItem("userRole");
  if (userRole === "admin") {
    populateUserTable();
    setupModal(); // Set up modal close buttons
  }
});

// --- NEW: Function to set up modal close logic ---
function setupModal() {
  const modal = document.getElementById("user-details-modal");
  const closeBtn = document.getElementById("close-modal-btn");

  if (closeBtn) {
    closeBtn.onclick = () => {
      modal.style.display = "none";
    };
  }
  window.onclick = (event) => {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };
}

async function populateUserTable() {
  const tableBody = document.getElementById("user-table-body");
  if (!tableBody) return;
  tableBody.innerHTML = '<tr><td colspan="6">Loading users...</td></tr>';

  const token = localStorage.getItem("authToken");
  if (!token) {
    tableBody.innerHTML = '<tr><td colspan="6">Error: Not logged in.</td></tr>';
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/admin/users", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Failed to fetch users");
    const users = await response.json();

    if (users.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="6">No other users found.</td></tr>';
      return;
    }

    tableBody.innerHTML = ""; // Clear "Loading..."

    users.forEach((user) => {
      const row = document.createElement("tr");
      row.setAttribute("data-user-id", user.id); // Store ID for both buttons

      const statusText = user.status === "active" ? "Active" : "Inactive";
      const statusClass =
        user.status === "active" ? "status-active" : "status-inactive";

      // --- ADDED THE "btn-view" BUTTON ---
      row.innerHTML = `
        <td>${user.id}</td>
        <td>${user.fullname}</td>
        <td>${user.email}</td>
        <td>${user.phone || "N/A"}</td>
        <td><span class="${statusClass}">${statusText}</span></td>
        <td>
          <button class="btn-view">View</button>
          <button class="btn-remove">Remove</button>
        </td>
      `;
      tableBody.appendChild(row);
    });

    // Now that the buttons exist, add listeners to them
    addTableButtonListeners(token);
  } catch (err) {
    console.error("Error populating users:", err);
    tableBody.innerHTML = `<tr><td colspan="6">Error loading users: ${err.message}</td></tr>`;
  }
}

// --- RENAMED: This function now handles BOTH buttons ---
function addTableButtonListeners(token) {
  const modal = document.getElementById("user-details-modal");

  // --- "View" Button Logic ---
  document.querySelectorAll(".btn-view").forEach((button) => {
    button.addEventListener("click", async (event) => {
      const row = event.target.closest("tr");
      const userId = row.getAttribute("data-user-id");

      // Show modal with loading state
      modal.style.display = "block";
      document.getElementById("detail-user-name").textContent = "Loading...";
      document.getElementById("detail-user-email").textContent = "Loading...";
      document.getElementById("detail-user-phone").textContent = "Loading...";
      document.getElementById("detail-user-role").textContent = "Loading...";
      document.getElementById("detail-user-status").textContent = "Loading...";
      document.getElementById("detail-user-address").textContent = "Loading...";
      document.getElementById("detail-user-created-at").textContent =
        "Loading...";

      try {
        // --- Call the new API to get full details ---
        const response = await fetch(
          `http://localhost:5000/api/admin/users/${userId}`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch user details");

        const user = await response.json();

        // Populate the modal with the full data
        document.getElementById("detail-user-name").textContent = user.fullname;
        document.getElementById("detail-user-email").textContent = user.email;
        document.getElementById("detail-user-phone").textContent =
          user.phone || "N/A";
        document.getElementById("detail-user-role").textContent =
          user.user_role;
        document.getElementById("detail-user-status").textContent = user.status;
        document.getElementById("detail-user-address").textContent =
          user.address || "N/A";
        document.getElementById("detail-user-created-at").textContent =
          new Date(user.created_at).toLocaleString();
      } catch (err) {
        console.error("Error fetching user details:", err);
        document.getElementById("detail-user-name").textContent =
          "Error loading details.";
      }
    });
  });

  // --- "Remove" Button Logic (Same as before) ---
  document.querySelectorAll(".btn-remove").forEach((button) => {
    button.addEventListener("click", async (event) => {
      const row = event.target.closest("tr");
      if (!row) return;

      const userId = row.getAttribute("data-user-id");
      const userName = row.cells[1].textContent;

      if (
        confirm(
          `Are you sure you want to remove the user "${userName}"? This is permanent.`
        )
      ) {
        try {
          const response = await fetch(
            `http://localhost:5000/api/admin/users/${userId}`,
            {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (!response.ok) throw new Error("Failed to remove user");

          row.style.transition = "opacity 0.5s ease-out";
          row.style.opacity = "0";
          setTimeout(() => row.remove(), 500);
        } catch (err) {
          console.error("Error removing user:", err);
          alert("Error: Could not remove user.");
        }
      }
    });
  });
}
