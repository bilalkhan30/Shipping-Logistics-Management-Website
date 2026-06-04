document.addEventListener("DOMContentLoaded", () => {
  // =================================================
  // ROUTING LOGIC
  // =================================================
  const userRole = localStorage.getItem("userRole");
  const logoutButton = document.getElementById("logout-button");
  const mainNav = document.querySelector(".main-nav");

  // --- 1. Handle Logout ---
  if (logoutButton) {
    logoutButton.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("userRole");
      window.location.href = "../index.html";
    });
  }

  // --- 2. Check Role and Setup Page ---
  if (userRole === "admin") {
    // *** FIX FOR ADMIN SIDEBAR GLITCH ***
    // This page (dashboard.html) now uses the correct animation
    const adminSidebar = document.getElementById("admin-sidebar");
    if (adminSidebar) {
      setTimeout(() => {
        document.querySelector(".dashboard-layout").style.gridTemplateColumns =
          "250px 1fr";
        adminSidebar.style.transform = "translateX(0)";
      }, 1); // 1ms delay to prevent glitch
    }
    // Now build the admin content
    buildAdminDashboard();
  } else if (
    userRole === "customer" ||
    userRole === "supplier" ||
    userRole === "transporter"
  ) {
    // *** FIX FOR NON-ADMIN WHITE SPACE ***
    // 1. Explicitly hide the sidebar element
    document.getElementById("admin-sidebar").style.display = "none";

    // 2. Add the class to switch to a 1-column layout
    document
      .querySelector(".dashboard-layout")
      .classList.add("full-width-layout");

    // 3. Dynamically build the header
    if (mainNav) {
      const dashboardLink = document.createElement("a");
      dashboardLink.href = "dashboard.html";
      dashboardLink.textContent = "My Dashboard";
      dashboardLink.style.backgroundColor = "var(--secondary-color)";

      const profileLink = document.createElement("a");
      profileLink.href = "my-profile.html";
      profileLink.textContent = "My Profile";

      mainNav.insertBefore(dashboardLink, logoutButton);
      mainNav.insertBefore(profileLink, logoutButton);
    }

    // 4. Call the correct dashboard builder
    if (userRole === "customer") {
      setupBasicDashboard(userRole);
    } else if (userRole === "supplier") {
      setupSupplierDashboard(userRole);
    } else if (userRole === "transporter") {
      setupTransporterDashboard(userRole);
    } else {
      setupBasicDashboard(userRole); // Fallback
    }
  } else {
    // Not logged in at all. Send to login.
    window.location.href = "../index.html";
  }
});

/*
  =================================================
  CUSTOMER DASHBOARD
  (No changes below this line, but use this full file)
  =================================================
*/
function setupBasicDashboard(roleName) {
  const welcomeHeading = document.getElementById("welcome-heading");
  if (welcomeHeading) {
    const displayName = roleName.charAt(0).toUpperCase() + roleName.slice(1);
    welcomeHeading.textContent = `Welcome, ${displayName}!`;
  }

  const dashboardContent = document.querySelector(".dashboard-content");
  if (dashboardContent) {
    dashboardContent.innerHTML = `
      <h3 class="content-title">Your Shipments</h3>
      <p>This is where you can view your active shipments and track their status.</p>
      <br>
      <h3 class="content-title">Quick Actions</h3>
      <div class="quick-actions-container">
        <a href="create-shipment.html" class="btn-create-new">Create New Shipment</a>
        <a href="my-shipments.html" class="btn-create-new">View My Shipments</a>
      </div>
    `;
  }
}

/*
  =================================================
  SUPPLIER DASHBOARD
  =================================================
*/
function setupSupplierDashboard(roleName) {
  const welcomeHeading = document.getElementById("welcome-heading");
  if (welcomeHeading) {
    welcomeHeading.textContent = `Welcome, Supplier!`;
  }

  const dashboardContent = document.querySelector(".dashboard-content");
  if (dashboardContent) {
    dashboardContent.innerHTML = `
      <h3 class="content-title">Pending Shipments</h3>
      <p>View all shipment requests assigned to you that are awaiting preparation.</p>
      <br>
      <h3 class="content-title">Quick Actions</h3>
      <div class="quick-actions-container">
        <a href="create-shipment.html" class="btn-create-new">Create New Shipment</a>
        <a href="supplier-shipments.html" class="btn-create-new">View All Shipments</a>
      </div>
    `;
  }
}

/*
  =================================================
  TRANSPORTER DASHBOARD
  =================================================
*/
function setupTransporterDashboard(roleName) {
  const welcomeHeading = document.getElementById("welcome-heading");
  if (welcomeHeading) {
    welcomeHeading.textContent = `Welcome, Transporter!`;
  }

  const dashboardContent = document.querySelector(".dashboard-content");
  if (dashboardContent) {
    dashboardContent.innerHTML = `
      <h3 class="content-title">Available Jobs</h3>
      <p>View and accept shipments that are ready for transport.</p>
      <br>
      <h3 class="content-title">Quick Actions</h3>
      <div class="quick-actions-container">
        <a href="transporter-jobs.html" class="btn-create-new">View Available Jobs</a>
        <a href="my-active-jobs.html" class="btn-create-new">My Active Jobs</a>
      </div>
    `;
  }
}

/*
  =================================================
  ADMIN-ONLY DASHBOARD (NEW DYNAMIC VERSION)
  =================================================
*/
// vvv REPLACE your old buildAdminDashboard function with this vvv
async function buildAdminDashboard() {
  const welcomeHeading = document.getElementById("welcome-heading");
  if (welcomeHeading) {
    welcomeHeading.textContent = "Welcome, Admin!";
  }

  const dashboardContent = document.querySelector(".dashboard-content");
  if (!dashboardContent) {
    console.error("CRITICAL: Dashboard content area not found.");
    return;
  }

  // Keep the original HTML structure
  const statsHTML = `
        <h3 class="content-title">At a Glance</h3>
        <div class="stat-card-container">
            <div class="stat-card card-blue"><div class="card-icon">📦</div><div class="card-info"><h4>Total Shipments</h4><p id="stat-total-shipments">...</p></div></div>
            <div class="stat-card card-orange"><div class="card-icon">🚚</div><div class="card-info"><h4>In Transit</h4><p id="stat-in-transit">...</p></div></div>
            <div class="stat-card card-green"><div class="card-icon">✅</div><div class="card-info"><h4>Delivered</h4><p id="stat-delivered">...</p></div></div>
            <div class="stat-card card-red"><div class="card-icon">👤</div><div class="card-info"><h4>Pending Users</h4><p id="stat-pending-users">...</p></div></div>
        </div> 
        <h3 class="content-title">Pending User Approvals</h3>
    `;
  const tableHTML = `
        <table class="activity-table">
            <thead> <tr> <th>Name</th> <th>Role</th> <th>Email</th> <th>Phone</th> <th>Action</th> </tr> </thead>
            <tbody id="pending-users-table-body">
                <tr><td colspan="5">Loading...</td></tr>
            </tbody>
        </table>
    `;

  const placeholder = dashboardContent.querySelector("p");
  if (placeholder) {
    placeholder.remove();
    dashboardContent.insertAdjacentHTML("afterbegin", statsHTML);
    dashboardContent.insertAdjacentHTML("beforeend", tableHTML);
  }

  // Get the token
  const token = localStorage.getItem("authToken");
  if (!token) {
    window.location.href = "../login.html";
    return;
  }
  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  try {
    // --- CALL OUR NEW, COMBINED API ---
    const response = await fetch(
      "http://localhost:5000/api/admin/dashboard-summary",
      {
        method: "GET",
        headers: authHeaders,
      }
    );

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("userRole");
      window.location.href = "../login.html";
      return;
    }
    if (!response.ok) {
      throw new Error("Failed to fetch dashboard summary");
    }

    const summary = await response.json();

    // --- 1. Populate the "At a Glance" Stat Cards ---
    document.getElementById("stat-total-shipments").textContent =
      summary.stats.total_shipments || "0";
    document.getElementById("stat-in-transit").textContent =
      summary.stats.in_transit || "0";
    document.getElementById("stat-delivered").textContent =
      summary.stats.delivered || "0";
    document.getElementById("stat-pending-users").textContent =
      summary.pendingUsers.length;

    // --- 2. Populate the Pending Users Table ---
    const tableBody = document.getElementById("pending-users-table-body");
    tableBody.innerHTML = ""; // Clear "Loading..."

    if (summary.pendingUsers.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="5">No pending users found.</td></tr>';
      return;
    }

    summary.pendingUsers.forEach((user) => {
      const row = document.createElement("tr");
      row.setAttribute("data-user-id", user.id);
      row.innerHTML = `
          <td>${user.fullname}</td>
          <td>${user.user_role}</td>
          <td>${user.email}</td>
          <td>${user.phone}</td>
          <td>
              <button class="btn-approve">Approve</button>
              <button class="btn-deny">Deny</button>
          </td>
      `;
      tableBody.appendChild(row);
    });

    // Pass the authHeaders to the event listener handler
    addTableEventListeners(authHeaders);
  } catch (err) {
    console.error(err);
    document.getElementById("pending-users-table-body").innerHTML =
      '<tr><td colspan="5">Error loading dashboard. Please try again.</td></tr>';
  }
}
// ^^^ This is the end of the function to replace ^^^

function populateWithMockData() {
  const users = [
    {
      id: 201,
      fullname: "Pending Customer",
      user_role: "customer",
      email: "p.customer@email.com",
      phone: "555-1234",
    },
    {
      id: 202,
      fullname: "Pending Supplier",
      user_role: "supplier",
      email: "p.supplier@email.com",
      phone: "555-5678",
    },
  ];

  const countElement = document.getElementById("stat-pending-users");
  if (countElement) countElement.textContent = users.length;

  const tableBody = document.getElementById("pending-users-table-body");
  tableBody.innerHTML = "";

  users.forEach((user) => {
    const row = document.createElement("tr");
    row.setAttribute("data-user-id", user.id);
    row.innerHTML = `
          <td>${user.fullname}</td>
          <td>${user.user_role}</td>
          <td>${user.email}</td>
          <td>${user.phone}</td>
          <td>
              <button class="btn-approve">Approve</button>
              <button class="btn-deny">Deny</button>
          </td>
      `;
    tableBody.appendChild(row);
  });
}

function addTableEventListeners(authHeaders) {
  // <-- ADDED authHeaders
  const approveButtons = document.querySelectorAll(".btn-approve");
  const denyButtons = document.querySelectorAll(".btn-deny");

  approveButtons.forEach((button) => {
    button.addEventListener("click", (event) =>
      handleUserAction(event, authHeaders)
    ); // <-- PASS authHeaders
  });

  denyButtons.forEach((button) => {
    button.addEventListener("click", (event) =>
      handleUserAction(event, authHeaders)
    ); // <-- PASS authHeaders
  });
}

async function handleUserAction(event, authHeaders) {
  // <-- ADDED authHeaders
  const button = event.target;
  const row = button.closest("tr");
  const userId = row.getAttribute("data-user-id");
  const isApprove = button.classList.contains("btn-approve");

  row.querySelectorAll("button").forEach((btn) => (btn.disabled = true));

  try {
    let response;
    if (isApprove) {
      response = await fetch(
        `http://localhost:5000/api/admin/users/${userId}/approve`,
        {
          method: "PATCH",
          headers: authHeaders, // <-- USE authHeaders HERE
        }
      );
    } else {
      response = await fetch(
        `http://localhost:5000/api/admin/users/${userId}`,
        {
          method: "DELETE",
          headers: authHeaders, // <-- AND USE authHeaders HERE
        }
      );
    }

    if (response.ok) {
      row.style.transition = "opacity 0.5s ease-out";
      row.style.opacity = "0";
      setTimeout(() => {
        row.remove();
        updatePendingUsersCount();
      }, 500);
    } else {
      alert("Failed to update user.");
      row.querySelectorAll("button").forEach((btn) => (btn.disabled = false));
    }
  } catch (err) {
    console.error(err);
    // This is better than the original file's demo
    alert("A network error occurred. Please try again.");
    row.querySelectorAll("button").forEach((btn) => (btn.disabled = false));
  }
}

function updatePendingUsersCount() {
  const countElement = document.getElementById("stat-pending-users");
  if (countElement) {
    let currentCount = parseInt(countElement.textContent);
    if (!isNaN(currentCount) && currentCount > 0) {
      currentCount--;
      countElement.textContent = currentCount;
    }
  }
}
