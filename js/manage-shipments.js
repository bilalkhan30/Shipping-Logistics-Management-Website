document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("userRole") === "admin") {
    // --- 1. Populate the table on page load ---
    populateShipmentsTable();

    // --- 2. Get Modal Elements ---
    const modal = document.getElementById("shipment-modal");
    const closeBtn = document.getElementById("close-modal-btn");

    // --- 3. Close Modal Logic ---
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

    // --- 4. Logic for "Cancel" Buttons (from original file) ---
    // We add this *inside* the populate function now
  }
});

async function populateShipmentsTable() {
  const tableBody = document.querySelector(".activity-table tbody");
  if (!tableBody) return;
  tableBody.innerHTML = '<tr><td colspan="6">Loading shipments...</td></tr>';

  const token = localStorage.getItem("authToken");
  if (!token) {
    tableBody.innerHTML = '<tr><td colspan="6">Error: Not logged in.</td></tr>';
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/shipments", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch shipments");
    }

    const shipments = await response.json();

    if (shipments.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="6">No shipments found.</td></tr>';
      return;
    }

    tableBody.innerHTML = ""; // Clear "Loading..."

    shipments.forEach((shipment) => {
      const row = document.createElement("tr");
      // Store all data in the row for the modal
      row.setAttribute("data-shipment", JSON.stringify(shipment));

      const statusClass = `status-${shipment.status
        .toLowerCase()
        .replace(" ", "-")}`;

      row.innerHTML = `
        <td>${shipment.tracking_id}</td>
        <td>${shipment.requester_name}</td>
        <td>${shipment.supplier_name || "N/A"}</td>
        <td>${shipment.destination}</td>
        <td><span class="status ${statusClass}">${shipment.status}</span></td>
        <td>
          <button class="btn-view">View</button>
          <button class="btn-cancel">Cancel</button>
        </td>
      `;
      tableBody.appendChild(row);
    });

    // --- 5. Add Event Listeners for new buttons ---
    addTableButtonListeners();
  } catch (err) {
    console.error("Error populating shipments:", err);
    tableBody.innerHTML = `<tr><td colspan="6">Error loading shipments: ${err.message}</td></tr>`;
  }
}

// vvv REPLACE your old addTableButtonListeners function with this one vvv
function addTableButtonListeners() {
  const modal = document.getElementById("shipment-modal");
  const token = localStorage.getItem("authToken"); // Get the token

  // --- "View" Button Logic (NOW ASYNC) ---
  document.querySelectorAll(".btn-view").forEach((button) => {
    button.addEventListener("click", async (event) => {
      const row = event.target.closest("tr");
      const summary = JSON.parse(row.getAttribute("data-shipment"));
      const shipmentId = summary.id;

      modal.style.display = "block";
      modal.querySelector(
        "h2"
      ).textContent = `Shipment Details (${summary.tracking_id})`;

      // Set all fields to loading...
      document.getElementById("detail-requester-name").textContent =
        summary.requester_name;
      document.getElementById("detail-requester-phone").textContent =
        "Loading...";
      document.getElementById("detail-requester-role").textContent =
        "Loading...";
      document.getElementById("detail-origin").textContent = "Loading...";
      document.getElementById("detail-pickup").textContent = "Loading...";
      document.getElementById("detail-destination").textContent =
        summary.destination;
      document.getElementById("detail-item").textContent = "Loading...";
      document.getElementById("detail-type").textContent = "Loading...";
      document.getElementById("detail-quantity").textContent = "Loading...";
      document.getElementById("detail-weight").textContent = "Loading...";
      document.getElementById("detail-created-at").textContent = "Loading..."; // <-- ADDED THIS

      try {
        // --- NEW API CALL ---
        const response = await fetch(
          `http://localhost:5000/api/shipments/${shipmentId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch details");
        }

        const details = await response.json(); // Get the FULL shipment object

        // --- Populate Modal with FULL Details ---
        document.getElementById("detail-requester-name").textContent =
          details.requester_name;
        document.getElementById("detail-requester-phone").textContent =
          details.requester_phone;
        document.getElementById("detail-requester-role").textContent =
          details.requester_role;

        document.getElementById("detail-origin").textContent = details.origin;
        document.getElementById("detail-pickup").textContent = details.origin;
        document.getElementById("detail-destination").textContent =
          details.destination;

        document.getElementById("detail-item").textContent =
          details.item_description;
        document.getElementById("detail-type").textContent =
          details.shipment_type;
        document.getElementById("detail-quantity").textContent =
          details.quantity;
        document.getElementById(
          "detail-weight"
        ).textContent = `${details.weight_kg} kg`;

        // vvv ADD THIS NEW LINE vvv
        // Format the date to be human-readable
        const requestedDate = new Date(details.created_at).toLocaleString();
        document.getElementById("detail-created-at").textContent =
          requestedDate;
        // ^^^ END OF NEW LINE ^^^
      } catch (err) {
        console.error("Error fetching shipment details:", err);
        modal.querySelector("h2").textContent = "Error loading details";
      }
    });
  });

  // --- "Cancel" Button Logic (Same as before) ---
  document.querySelectorAll(".btn-cancel").forEach((button) => {
    button.addEventListener("click", async (event) => {
      const row = event.target.closest("tr");
      if (!row) return;

      const summary = JSON.parse(row.getAttribute("data-shipment"));
      const shipmentId = summary.id;
      const trackingId = summary.tracking_id;

      if (
        confirm(
          `Are you sure you want to permanently delete shipment ${trackingId}?`
        )
      ) {
        try {
          const response = await fetch(
            `http://localhost:5000/api/shipments/${shipmentId}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || "Failed to delete shipment");
          }

          row.style.transition = "opacity 0.5s ease-out";
          row.style.opacity = "0";
          setTimeout(() => {
            row.remove();
          }, 500);
        } catch (err) {
          console.error("Error deleting shipment:", err);
          alert(`Error: ${err.message}`);
        }
      }
    });
  });
}
// ^^^ This is the end of the function to replace ^^^
