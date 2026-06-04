document.addEventListener("DOMContentLoaded", () => {
  // This script only runs if the user is an admin
  if (localStorage.getItem("userRole") !== "admin") {
    return;
  }

  // --- Get Page Elements ---
  const reportForm = document.getElementById("report-form");
  const messageHolder = document.getElementById("report-message");
  const resultsContainer = document.getElementById("report-results");
  const token = localStorage.getItem("authToken");

  // --- Add Form Submit Listener ---
  if (reportForm) {
    reportForm.addEventListener("submit", async (e) => {
      // <-- Made this async
      e.preventDefault(); // Stop the form from submitting

      if (!token) {
        showMessage("Error: Not logged in.", "red");
        return;
      }

      // 1. Get form data
      const startDate = document.getElementById("start-date").value;
      const endDate = document.getElementById("end-date").value;

      // 2. Simple Validation
      if (!startDate || !endDate) {
        showMessage("Please select both a start and end date.", "red");
        return;
      }
      if (endDate < startDate) {
        showMessage("End date cannot be before the start date.", "red");
        return;
      }

      // 3. Show loading/success message
      showMessage("Generating report...", "var(--primary-color)");
      resultsContainer.style.display = "none"; // Hide old results

      try {
        // 4. Call the REAL API
        const response = await fetch(
          "http://localhost:5000/api/admin/reports/shipments",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ startDate, endDate }),
          }
        );

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.message || "Failed to generate report");
        }

        const report = await response.json(); // Get the real data

        // 5. Populate the (real) data
        populateReportResults(startDate, endDate, report);

        // 6. Show the results container
        showMessage("", "green"); // Clear loading message
        resultsContainer.style.display = "block";
      } catch (err) {
        console.error("Report generation error:", err);
        showMessage(`Error: ${err.message}`, "red");
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

// This function is now REAL
function populateReportResults(startDate, endDate, report) {
  // --- 1. Update Report Title ---
  // Format dates for display (e.g., 2023-11-01 -> 11/01/2023)
  const formattedStart = new Date(startDate + "T00:00:00").toLocaleDateString();
  const formattedEnd = new Date(endDate + "T00:00:00").toLocaleDateString();

  document.getElementById(
    "report-date-range"
  ).textContent = `${formattedStart} to ${formattedEnd}`;

  // --- 2. Update Real Stats ---
  document.getElementById("report-stat-total").textContent =
    report.stats.total_shipments || "0";
  document.getElementById("report-stat-delivered").textContent =
    report.stats.delivered || "0";
  document.getElementById("report-stat-transit").textContent =
    report.stats.in_transit || "0";

  // --- 3. Update Real Table ---
  const tableBody = document.getElementById("report-table-body");
  tableBody.innerHTML = ""; // Clear previous results

  if (!report.shipments || report.shipments.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="4">No shipments found in this date range.</td></tr>';
    return;
  }

  report.shipments.forEach((item) => {
    // We re-use the status classes from shipments.css
    const statusClass = `status-${item.status.toLowerCase().replace(" ", "-")}`;

    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${item.tracking_id}</td>
        <td>${item.requester_name}</td>
        <td><span class="status ${statusClass}">${item.status}</span></td>
        <td>${new Date(item.created_at).toLocaleDateString()}</td>
    `;
    tableBody.appendChild(row);
  });
}
