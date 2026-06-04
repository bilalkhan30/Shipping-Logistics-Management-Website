document.addEventListener("DOMContentLoaded", () => {
  // --- 1. FIX THE LAYOUT ---
  document
    .querySelector(".dashboard-layout")
    .classList.add("full-width-layout");

  // --- 2. DYNAMICALLY RE-BUILD HEADER LINKS ---
  const mainNav = document.querySelector(".main-nav");
  if (mainNav) {
    mainNav.innerHTML = ""; // Wipe all existing content
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

  // --- 3. Handle Logout ---
  const logoutButton = document.getElementById("logout-button");
  if (logoutButton) {
    logoutButton.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("userRole");
      localStorage.removeItem("authToken");
      window.location.href = "../index.html";
    });
  }

  // --- 4. Populate the jobs table ---
  populateActiveJobsTable();
});

async function populateActiveJobsTable() {
  const tableBody = document.getElementById("active-jobs-table-body");
  if (!tableBody) return;
  tableBody.innerHTML =
    '<tr><td colspan="5">Loading your active jobs...</td></tr>';

  const token = localStorage.getItem("authToken");
  if (!token) {
    tableBody.innerHTML = '<tr><td colspan="5">Error: Not logged in.</td></tr>';
    return;
  }

  try {
    const response = await fetch(
      "http://localhost:5000/api/shipments/my-active",
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) throw new Error("Failed to fetch your jobs");

    const jobs = await response.json();

    if (jobs.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="5">You have no active jobs.</td></tr>';
      return;
    }

    tableBody.innerHTML = ""; // Clear "Loading..."

    jobs.forEach((job) => {
      const row = document.createElement("tr");
      row.setAttribute("data-shipment-id", job.id); // Store ID on the row
      const statusClass = `status-${job.status
        .toLowerCase()
        .replace(" ", "-")}`;

      row.innerHTML = `
          <td>${job.tracking_id}</td>
          <td>${job.origin}</td>
          <td>${job.destination}</td>
          <td class="status-cell">
            <span class="status ${statusClass}">${job.status}</span>
          </td>
          <td class="action-cell">
            <select class="status-select">
              <option value="In Transit" ${
                job.status === "In Transit" ? "selected" : ""
              }>In Transit</option>
              <option value="Delivered" ${
                job.status === "Delivered" ? "selected" : ""
              }>Delivered</option>
            </select>
            <button class="btn-update">Update</button>
          </td>
      `;
      tableBody.appendChild(row);

      // If job is already delivered, disable the controls
      if (job.status === "Delivered") {
        const select = row.querySelector(".status-select");
        const button = row.querySelector(".btn-update");
        select.disabled = true;
        button.disabled = true;
        button.textContent = "Done";
        button.style.backgroundColor = "#6c757d"; // Grey
      }
    });

    // --- 5. Add logic for the "Update" buttons ---
    addUpdateListeners(token);
  } catch (err) {
    console.error("Error populating active jobs:", err);
    tableBody.innerHTML = `<tr><td colspan="5">Error loading jobs: ${err.message}</td></tr>`;
  }
}

// --- 5. Add logic for the "Update" buttons ---
function addUpdateListeners(token) {
  const allUpdateButtons = document.querySelectorAll(".btn-update");

  allUpdateButtons.forEach((button) => {
    button.addEventListener("click", async (event) => {
      const updateButton = event.target;
      const row = updateButton.closest("tr");
      if (!row) return;

      const shipmentId = row.getAttribute("data-shipment-id");
      const select = row.querySelector(".status-select");
      const newStatus = select.value;

      updateButton.textContent = "Updating...";
      updateButton.disabled = true;
      select.disabled = true;

      try {
        // --- Call the new "Update Status" API ---
        const response = await fetch(
          `http://localhost:5000/api/shipments/${shipmentId}/status`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ newStatus: newStatus }),
          }
        );

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.message || "Update failed");
        }

        // Success! Find the status span to update it
        const statusSpan = row.querySelector(".status-cell .status");
        statusSpan.textContent = newStatus;
        statusSpan.className = `status status-${newStatus.toLowerCase()}`;

        // If the new status is "Delivered", permanently disable the controls
        if (newStatus === "Delivered") {
          updateButton.textContent = "Done";
          updateButton.style.backgroundColor = "#6c757d"; // Grey
        } else {
          updateButton.textContent = "Update";
          updateButton.disabled = false;
          select.disabled = false;
        }
      } catch (err) {
        console.error("Error updating status:", err);
        alert(err.message);
        updateButton.textContent = "Update";
        updateButton.disabled = false;
        select.disabled = false;
      }
    });
  });
}
