document.addEventListener("DOMContentLoaded", () => {
  // --- 1. Fix the layout ---
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
    logoutLink.id = "logout-button"; // Give it the ID
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
      localStorage.removeItem("authToken"); // Also remove the token
      window.location.href = "../index.html";
    });
  }

  // --- 4. Populate the table (NOW WITH REAL DATA) ---
  populateShipmentTable();
});

async function populateShipmentTable() {
  const tableBody = document.getElementById("shipments-table-body");
  if (!tableBody) return;
  tableBody.innerHTML = '<tr><td colspan="4">Loading shipments...</td></tr>';

  const token = localStorage.getItem("authToken");
  if (!token) {
    tableBody.innerHTML = '<tr><td colspan="4">Error: Not logged in.</td></tr>';
    return;
  }

  try {
    const response = await fetch(
      "http://localhost:5000/api/shipments/my-shipments",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch shipments");
    }

    const shipments = await response.json();

    if (shipments.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="4">You have not created any shipments.</td></tr>';
      return;
    }

    tableBody.innerHTML = ""; // Clear "Loading..."

    shipments.forEach((shipment) => {
      const row = document.createElement("tr");
      // Get the correct CSS class for the status
      const statusClass = `status-${shipment.status
        .toLowerCase()
        .replace(" ", "-")}`;

      row.innerHTML = `
          <td>${shipment.tracking_id}</td>
          <td>${shipment.destination}</td> 
          <td>${shipment.supplier_name || "N/A"}</td>
          <td><span class="status ${statusClass}">${shipment.status}</span></td>
      `;
      tableBody.appendChild(row);
    });
  } catch (err) {
    console.error("Error populating shipments:", err);
    tableBody.innerHTML = `<tr><td colspan="4">Error loading shipments: ${err.message}</td></tr>`;
  }
}
