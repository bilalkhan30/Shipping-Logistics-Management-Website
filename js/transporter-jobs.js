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
  populateJobsTable();
});

async function populateJobsTable() {
  const tableBody = document.getElementById("jobs-table-body");
  if (!tableBody) return;
  tableBody.innerHTML =
    '<tr><td colspan="5">Loading available jobs...</td></tr>';

  const token = localStorage.getItem("authToken");
  if (!token) {
    tableBody.innerHTML = '<tr><td colspan="5">Error: Not logged in.</td></tr>';
    return;
  }

  try {
    const response = await fetch(
      "http://localhost:5000/api/shipments/available",
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) throw new Error("Failed to fetch available jobs");

    const jobs = await response.json();

    if (jobs.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="5">No available jobs found.</td></tr>';
      return;
    }

    tableBody.innerHTML = ""; // Clear "Loading..."

    jobs.forEach((job) => {
      const row = document.createElement("tr");
      row.setAttribute("data-shipment-id", job.id); // Store ID on the row

      row.innerHTML = `
          <td>${job.tracking_id}</td>
          <td>${job.origin}</td>
          <td>${job.destination}</td>
          <td><span class="status status-pending">${job.status}</span></td>
          <td>
            <button class="btn-approve">Accept Job</button> 
          </td>
      `;
      tableBody.appendChild(row);
    });

    // Now that buttons exist, add listeners
    addJobButtonListeners(token);
  } catch (err) {
    console.error("Error populating jobs:", err);
    tableBody.innerHTML = `<tr><td colspan="5">Error loading jobs: ${err.message}</td></tr>`;
  }
}

// --- 5. Add logic for the "Accept Job" buttons ---
function addJobButtonListeners(token) {
  const allAcceptButtons = document.querySelectorAll(".btn-approve");

  allAcceptButtons.forEach((button) => {
    button.addEventListener("click", async (event) => {
      const button = event.target;
      const row = button.closest("tr");
      const shipmentId = row.getAttribute("data-shipment-id");

      button.textContent = "Accepting...";
      button.disabled = true;

      try {
        // --- Call the new "Accept" API ---
        const response = await fetch(
          `http://localhost:5000/api/shipments/${shipmentId}/accept`,
          {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.message || "Failed to accept job");
        }

        // Success! Fade out and remove the row
        button.textContent = "Accepted!";
        button.style.backgroundColor = "#28a745";
        row.style.transition = "opacity 0.5s ease-out";
        row.style.opacity = "0";
        setTimeout(() => {
          row.remove();
        }, 500);
      } catch (err) {
        console.error("Error accepting job:", err);
        button.textContent = "Error";
        button.style.backgroundColor = "#dc3545";
        alert(err.message);
      }
    });
  });
}
