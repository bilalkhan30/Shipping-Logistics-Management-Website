document.addEventListener("DOMContentLoaded", () => {
  // This script runs *after* admin.js
  // admin.js handles the sidebar animation and auth check
  if (localStorage.getItem("userRole") === "admin") {
    populateActivityTable();
    setupModal(); // Set up modal close buttons
  }
});

// --- Function to set up modal close logic ---
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

// --- Function to fetch and fill the activity table ---
async function populateActivityTable() {
  const tableBody = document.getElementById("activity-table-body");
  if (!tableBody) return;
  tableBody.innerHTML = '<tr><td colspan="6">Loading activity...</td></tr>';

  const token = localStorage.getItem("authToken");
  if (!token) {
    tableBody.innerHTML = '<tr><td colspan="6">Error: Not logged in.</td></tr>';
    return;
  }

  try {
    // Call our new API endpoint
    const response = await fetch(
      "http://localhost:5000/api/admin/transporter-activity",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) throw new Error("Failed to fetch activity");
    const activities = await response.json();

    if (activities.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="6">No transporter activity found.</td></tr>';
      return;
    }

    tableBody.innerHTML = ""; // Clear "Loading..."

    activities.forEach((job) => {
      const row = document.createElement("tr");
      // Store ALL data from the job on the row
      row.setAttribute("data-job-info", JSON.stringify(job));

      const statusClass = `status-${job.status
        .toLowerCase()
        .replace(" ", "-")}`;

      row.innerHTML = `
          <td>${job.tracking_id}</td>
          <td>${job.transporter_name}</td>
          <td>${job.origin}</td>
          <td>${job.destination}</td>
          <td><span class="status ${statusClass}">${job.status}</span></td>
          <td>
            <button class="btn-view">View Transporter</button>
          </td>
        `;
      tableBody.appendChild(row);
    });

    // Now that the buttons exist, add listeners to them
    addTableButtonListeners(token);
  } catch (err) {
    console.error("Error populating activity:", err);
    tableBody.innerHTML = `<tr><td colspan="6">Error loading activity: ${err.message}</td></tr>`;
  }
}

// ... (keep populateActivityTable and setupModal as-is)

// vvv REPLACE THIS ENTIRE FUNCTION vvv
// --- Function to handle the "View Transporter" button clicks ---
function addTableButtonListeners(token) {
  const modal = document.getElementById("user-details-modal");

  // All the spans we need to fill
  const nameSpan = document.getElementById("detail-user-name");
  const emailSpan = document.getElementById("detail-user-email");
  const phoneSpan = document.getElementById("detail-user-phone");
  const statusSpan = document.getElementById("detail-user-status");
  const jobTrackingSpan = document.getElementById("detail-job-tracking");
  const jobStatusSpan = document.getElementById("detail-job-status");
  const jobAcceptedSpan = document.getElementById("detail-job-accepted");
  const jobDeliveredSpan = document.getElementById("detail-job-delivered"); // <-- ADDED THIS
  const jobCountSpan = document.getElementById("detail-job-count");
  const jobListContainer = document.getElementById("detail-job-list-container");

  document.querySelectorAll(".btn-view").forEach((button) => {
    button.addEventListener("click", async (event) => {
      const row = event.target.closest("tr");
      // 1. Get the job info we clicked on
      const job = JSON.parse(row.getAttribute("data-job-info"));

      // Show modal with loading state
      modal.style.display = "block";
      nameSpan.textContent = "Loading...";
      emailSpan.textContent = "Loading...";
      phoneSpan.textContent = "Loading...";
      statusSpan.textContent = "Loading...";
      jobListContainer.innerHTML = "<p>Loading jobs...</p>";
      jobCountSpan.textContent = "0";

      // 2. Populate the "Current Job" info immediately
      jobTrackingSpan.textContent = job.tracking_id;
      jobStatusSpan.textContent = job.status;
      jobAcceptedSpan.textContent = job.accepted_at
        ? new Date(job.accepted_at).toLocaleString()
        : "N/A";

      // vvv ADD THIS LINE vvv
      jobDeliveredSpan.textContent = job.delivered_at
        ? new Date(job.delivered_at).toLocaleString()
        : "Not yet delivered";
      // ^^^ END OF NEW LINE ^^^

      try {
        // 3. Call the API to get the transporter's FULL details
        const response = await fetch(
          `http://localhost:5000/api/admin/users/${job.transporter_id}`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch user details");

        const data = await response.json(); // Gets { profile: {...}, shipments: [...] }
        const user = data.profile;
        const allJobs = data.shipments;

        // 4. Populate the Transporter Profile section
        nameSpan.textContent = user.fullname;
        emailSpan.textContent = user.email;
        phoneSpan.textContent = user.phone || "N/A";
        statusSpan.textContent = user.status;

        // 5. Build and populate the "All Assigned Jobs" list
        jobCountSpan.textContent = allJobs.length;
        if (allJobs.length > 0) {
          let tableHtml =
            '<table class="modal-job-table"><thead><tr><th>Tracking #</th><th>Requester</th><th>Status</th></tr></thead><tbody>';

          allJobs.forEach((s) => {
            let statusClass = s.status
              ? `status-${s.status.toLowerCase().replace(" ", "-")}`
              : "status-pending";
            tableHtml += `
              <tr>
                <td>${s.tracking_id}</td>
                <td>${s.requester_name || "N/A"}</td>
                <td><span class="status ${statusClass}">${s.status}</span></td>
              </tr>
            `;
          });

          tableHtml += "</tbody></table>";
          jobListContainer.innerHTML = tableHtml;
        } else {
          jobListContainer.innerHTML =
            "<p>This transporter has no other jobs.</p>";
        }
      } catch (err) {
        console.error("Error fetching user details:", err);
        nameSpan.textContent = "Error loading details.";
      }
    });
  });
}
// ^^^ END OF REPLACEMENT ^^^
