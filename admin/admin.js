// ============================================
// ADMIN AUTHENTICATION
// ============================================

// Admin credentials (in real project, this would be in database)
const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "admin123",
};

// Check if admin is logged in
function isAdminLoggedIn() {
  return localStorage.getItem("adminLoggedIn") === "true";
}

// Admin login
function adminLogin(event) {
  event.preventDefault();

  const username = document.getElementById("adminUsername").value.trim();
  const password = document.getElementById("adminPassword").value.trim();

  if (
    username === ADMIN_CREDENTIALS.username &&
    password === ADMIN_CREDENTIALS.password
  ) {
    localStorage.setItem("adminLoggedIn", "true");
    localStorage.setItem("adminName", "Admin");
    window.location.href = "admin-dashboard.html";
  } else {
    showMessage("❌ Invalid username or password!", "error");
  }

  return false;
}

// Admin logout
function adminLogout() {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("adminName");
    window.location.href = "admin-login.html";
  }
}

// Check admin session on admin pages
function checkAdminSession() {
  if (!isAdminLoggedIn()) {
    window.location.href = "admin-login.html";
  }
}

// ============================================
// ADMIN DASHBOARD FUNCTIONS
// ============================================

function loadAdminDashboard() {
  checkAdminSession();

  // Set admin name
  const adminName = localStorage.getItem("adminName") || "Admin";
  const nameElement = document.getElementById("adminName");
  if (nameElement) nameElement.textContent = adminName;

  // Get data
  const donors = getDonors();
  const requests = getRequests();
  const stock = getBloodStock();

  // Update stats
  const statDonors = document.getElementById("statDonors");
  const statRequests = document.getElementById("statRequests");
  const statPending = document.getElementById("statPending");
  const statAvailable = document.getElementById("statAvailable");

  if (statDonors) statDonors.textContent = donors.length;
  if (statRequests) statRequests.textContent = requests.length;
  if (statPending)
    statPending.textContent = requests.filter(
      (r) => r.status === "Pending",
    ).length;
  if (statAvailable)
    statAvailable.textContent = donors.filter(
      (d) => d.status === "approved" && d.isAvailable,
    ).length;

  // Load pending donors
  loadPendingDonors();

  // Load recent requests
  loadRecentRequests();

  // Load stock summary
  loadAdminStockSummary();
}

function loadPendingDonors() {
  const donors = getDonors();
  const pendingDonors = donors.filter((d) => d.status === "pending");
  const tbody = document.getElementById("pendingDonorsBody");

  if (!tbody) return;

  if (pendingDonors.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5" style="text-align: center; color: #999;">No pending registrations</td></tr>';
    return;
  }

  tbody.innerHTML = pendingDonors
    .slice(0, 5)
    .map(
      (donor) => `
        <tr>
            <td><strong>${donor.fullName}</strong></td>
            <td><span class="blood-badge ${donor.bloodGroup.replace("+", "").replace("-", "")}">${donor.bloodGroup}</span></td>
            <td>${donor.city || "N/A"}</td>
            <td><span class="status-badge pending">Pending</span></td>
            <td>
                <button class="action-btn approve" onclick="handleApproveDonor(${donor.id})">✅ Approve</button>
                <button class="action-btn reject" onclick="handleRejectDonor(${donor.id})">❌ Reject</button>
            </td>
        </tr>
    `,
    )
    .join("");
}

function loadRecentRequests() {
  const requests = getRequests();
  const recentRequests = requests.slice(-5).reverse();
  const tbody = document.getElementById("recentRequestsBody");

  if (!tbody) return;

  if (recentRequests.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="4" style="text-align: center; color: #999;">No requests</td></tr>';
    return;
  }

  tbody.innerHTML = recentRequests
    .map(
      (request) => `
        <tr>
            <td>${request.patientName}</td>
            <td><span class="blood-badge ${request.bloodGroup.replace("+", "").replace("-", "")}">${request.bloodGroup}</span></td>
            <td><span class="urgency-badge ${request.urgency.toLowerCase()}">${request.urgency}</span></td>
            <td><span class="status-badge ${request.status.toLowerCase()}">${request.status}</span></td>
        </tr>
    `,
    )
    .join("");
}

function loadAdminStockSummary() {
  const stock = getBloodStock();
  const container = document.getElementById("adminStockSummary");

  if (!container) return;

  container.innerHTML = Object.entries(stock)
    .map(
      ([group, units]) => `
        <div style="background: #f8f9fa; padding: 0.8rem; border-radius: 8px; text-align: center;">
            <div style="font-weight: bold; font-size: 1.2rem; color: #c41e3a;">${group}</div>
            <div style="font-size: 1.5rem; font-weight: bold;">${units}</div>
            <div style="font-size: 0.8rem; color: #666;">units available</div>
        </div>
    `,
    )
    .join("");
}

// ============================================
// ADMIN DONORS MANAGEMENT
// ============================================

function loadDonorsTable() {
  checkAdminSession();

  const adminName = localStorage.getItem("adminName") || "Admin";
  const nameElement = document.getElementById("adminName");
  if (nameElement) nameElement.textContent = adminName;

  const allDonors = getDonors();
  const countElement = document.getElementById("donorCount");
  if (countElement) countElement.textContent = allDonors.length;

  renderDonors(allDonors);
}

function renderDonors(donors) {
  const tbody = document.getElementById("donorsTableBody");

  if (!tbody) return;

  if (donors.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" style="text-align: center; color: #999;">No donors found</td></tr>';
    return;
  }

  tbody.innerHTML = donors
    .map((donor, index) => {
      const status = donor.status || "pending";
      return `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${donor.fullName}</strong><br><small style="color:#999;">${donor.email}</small></td>
                <td><span class="blood-badge ${donor.bloodGroup.replace("+", "").replace("-", "")}">${donor.bloodGroup}</span></td>
                <td>${donor.city || "N/A"}</td>
                <td><span class="status-badge ${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span></td>
                <td>
                    <button class="action-btn view" onclick="viewDonor(${donor.id})">👁️ View</button>
                    ${
                      status === "pending"
                        ? `
                        <button class="action-btn approve" onclick="handleApproveDonor(${donor.id})">✅</button>
                        <button class="action-btn reject" onclick="handleRejectDonor(${donor.id})">❌</button>
                    `
                        : ""
                    }
                    <button class="action-btn delete" onclick="handleDeleteDonor(${donor.id})">🗑️</button>
                </td>
            </tr>
        `;
    })
    .join("");
}

function filterDonors() {
  const searchTerm = document
    .getElementById("searchDonor")
    .value.toLowerCase()
    .trim();
  const bloodGroup = document.getElementById("filterBloodGroup").value;
  const status = document.getElementById("filterStatus").value;

  let donors = getDonors();

  if (searchTerm) {
    donors = donors.filter(
      (d) =>
        d.fullName.toLowerCase().includes(searchTerm) ||
        d.email.toLowerCase().includes(searchTerm) ||
        (d.city && d.city.toLowerCase().includes(searchTerm)),
    );
  }

  if (bloodGroup) {
    donors = donors.filter((d) => d.bloodGroup === bloodGroup);
  }

  if (status) {
    donors = donors.filter((d) => (d.status || "pending") === status);
  }

  renderDonors(donors);
}

// ============================================
// DONOR ACTION HANDLERS (using app.js functions)
// ============================================

function handleApproveDonor(donorId) {
  if (!confirm("Approve this donor registration?")) return;

  if (approveDonor(donorId)) {
    showAdminMessage("✅ Donor approved successfully!", "success");
    // Reload current page
    if (document.getElementById("donorsTableBody")) {
      loadDonorsTable();
    }
    if (document.getElementById("pendingDonorsBody")) {
      loadPendingDonors();
    }
    updateStats();
  }
}

function handleRejectDonor(donorId) {
  if (!confirm("Reject this donor registration?")) return;

  if (rejectDonor(donorId)) {
    showAdminMessage("❌ Donor rejected.", "error");
    if (document.getElementById("donorsTableBody")) {
      loadDonorsTable();
    }
    if (document.getElementById("pendingDonorsBody")) {
      loadPendingDonors();
    }
    updateStats();
  }
}

function handleDeleteDonor(donorId) {
  if (!confirm("Are you sure you want to delete this donor permanently?"))
    return;

  if (deleteDonor(donorId)) {
    showAdminMessage("🗑️ Donor deleted successfully!", "success");
    if (document.getElementById("donorsTableBody")) {
      loadDonorsTable();
    }
    updateStats();
  }
}

function viewDonor(donorId) {
  const donors = getDonors();
  const donor = donors.find((d) => d.id === donorId);

  if (!donor) {
    showAdminMessage("Donor not found!", "error");
    return;
  }

  const details = document.getElementById("donorDetails");
  if (details) {
    details.innerHTML = `
            <div style="margin-bottom: 1rem;">
                <p><strong>Name:</strong> ${donor.fullName}</p>
                <p><strong>Email:</strong> ${donor.email}</p>
                <p><strong>Phone:</strong> ${donor.phone || "N/A"}</p>
                <p><strong>Blood Group:</strong> ${donor.bloodGroup}</p>
                <p><strong>Age:</strong> ${donor.age || "N/A"}</p>
                <p><strong>Gender:</strong> ${donor.gender || "N/A"}</p>
                <p><strong>City:</strong> ${donor.city || "N/A"}</p>
                <p><strong>Address:</strong> ${donor.address || "N/A"}</p>
                <p><strong>Status:</strong> <span class="status-badge ${donor.status || "pending"}">${(donor.status || "pending").charAt(0).toUpperCase() + (donor.status || "pending").slice(1)}</span></p>
                <p><strong>Registered:</strong> ${new Date(donor.registeredAt).toLocaleDateString()}</p>
                <p><strong>Total Donations:</strong> ${donor.totalDonations || 0}</p>
            </div>
        `;
  }

  const modal = document.getElementById("viewDonorModal");
  if (modal) modal.classList.add("active");
}

// ============================================
// ADMIN BLOOD REQUESTS MANAGEMENT
// ============================================

function loadRequestsTable() {
  checkAdminSession();

  const adminName = localStorage.getItem("adminName") || "Admin";
  const nameElement = document.getElementById("adminName");
  if (nameElement) nameElement.textContent = adminName;

  const allRequests = getRequests();
  const countElement = document.getElementById("requestCount");
  if (countElement) countElement.textContent = allRequests.length;

  renderRequests(allRequests);
}

function renderRequests(requests) {
  const tbody = document.getElementById("requestsTableBody");

  if (!tbody) return;

  if (requests.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" style="text-align: center; color: #999;">No blood requests found</td></tr>';
    return;
  }

  // Show latest first
  const sortedRequests = [...requests].reverse();

  tbody.innerHTML = sortedRequests
    .map(
      (request) => `
        <tr>
            <td>${request.requestId || "#" + request.id}</td>
            <td><strong>${request.patientName}</strong></td>
            <td><span class="blood-badge ${request.bloodGroup.replace("+", "").replace("-", "")}">${request.bloodGroup}</span></td>
            <td>${request.hospital}</td>
            <td><span class="urgency-badge ${request.urgency.toLowerCase()}">${request.urgency}</span></td>
            <td><span class="status-badge ${request.status.toLowerCase()}">${request.status}</span></td>
            <td>
                ${
                  request.status === "Pending"
                    ? `
                    <button class="action-btn approve" onclick="handleApproveRequest(${request.id})">✅ Approve</button>
                    <button class="action-btn fulfill" onclick="handleFulfillRequest(${request.id})">🏁 Fulfill</button>
                    <button class="action-btn reject" onclick="handleCancelRequest(${request.id})">❌ Cancel</button>
                `
                    : ""
                }
                <button class="action-btn view" onclick="viewRequest(${request.id})">👁️</button>
            </td>
        </tr>
    `,
    )
    .join("");
}

function filterRequests() {
  const searchTerm = document
    .getElementById("searchRequest")
    .value.toLowerCase()
    .trim();
  const bloodGroup = document.getElementById("filterRequestBloodGroup").value;
  const status = document.getElementById("filterRequestStatus").value;

  let requests = getRequests();

  if (searchTerm) {
    requests = requests.filter(
      (r) =>
        r.patientName.toLowerCase().includes(searchTerm) ||
        r.hospital.toLowerCase().includes(searchTerm),
    );
  }

  if (bloodGroup) {
    requests = requests.filter((r) => r.bloodGroup === bloodGroup);
  }

  if (status) {
    requests = requests.filter((r) => r.status === status);
  }

  renderRequests(requests);
}

function handleApproveRequest(requestId) {
  if (!confirm("Approve this blood request?")) return;

  let requests = getRequests();
  const index = requests.findIndex((r) => r.id === requestId);

  if (index !== -1) {
    requests[index].status = "Approved";
    saveRequests(requests);
    showAdminMessage(
      "✅ Blood request approved. Donors can now be searched by request ID.",
      "success",
    );
    loadRequestsTable();
    updateStats();
  }
}

function handleFulfillRequest(requestId) {
  if (!confirm("Mark this blood request as fulfilled?")) return;

  let requests = getRequests();
  const index = requests.findIndex((r) => r.id === requestId);

  if (index !== -1) {
    requests[index].status = "Fulfilled";
    saveRequests(requests);

    // Update blood stock
    const stock = getBloodStock();
    const bloodGroup = requests[index].bloodGroup;
    stock[bloodGroup] = (stock[bloodGroup] || 0) + (requests[index].units || 1);
    saveBloodStock(stock);

    showAdminMessage("✅ Request fulfilled! Blood stock updated.", "success");
    loadRequestsTable();
    updateStats();
  }
}

function handleCancelRequest(requestId) {
  if (!confirm("Cancel this blood request?")) return;

  let requests = getRequests();
  const index = requests.findIndex((r) => r.id === requestId);

  if (index !== -1) {
    requests[index].status = "Cancelled";
    saveRequests(requests);

    showAdminMessage("❌ Request cancelled.", "error");
    loadRequestsTable();
    updateStats();
  }
}

function viewRequest(requestId) {
  const requests = getRequests();
  const request = requests.find((r) => r.id === requestId);

  if (!request) {
    showAdminMessage("Request not found!", "error");
    return;
  }

  const details = document.getElementById("requestDetails");
  if (details) {
    details.innerHTML = `
            <div style="margin-bottom: 1rem;">
                <p><strong>Request ID:</strong> ${request.requestId || "#" + request.id}</p>
                <p><strong>Patient Name:</strong> ${request.patientName}</p>
                <p><strong>Blood Group:</strong> ${request.bloodGroup}</p>
                <p><strong>Hospital:</strong> ${request.hospital}</p>
                <p><strong>City:</strong> ${request.city || "N/A"}</p>
                <p><strong>Contact:</strong> ${request.contact || "N/A"}</p>
                <p><strong>Urgency:</strong> <span class="urgency-badge ${request.urgency.toLowerCase()}">${request.urgency}</span></p>
                <p><strong>Units Required:</strong> ${request.units || 1}</p>
                <p><strong>Status:</strong> <span class="status-badge ${request.status.toLowerCase()}">${request.status}</span></p>
                <p><strong>Date:</strong> ${new Date(request.date).toLocaleString()}</p>
                ${request.notes ? `<p><strong>Notes:</strong> ${request.notes}</p>` : ""}
            </div>
        `;
  }

  const modal = document.getElementById("viewRequestModal");
  if (modal) modal.classList.add("active");
}

// ============================================
// ADMIN BLOOD STOCK MANAGEMENT
// ============================================

function loadStockManagement() {
  checkAdminSession();

  const adminName = localStorage.getItem("adminName") || "Admin";
  const nameElement = document.getElementById("adminName");
  if (nameElement) nameElement.textContent = adminName;

  renderStockCards();
  renderStockTable();
}

function renderStockCards() {
  const stock = getBloodStock();
  const container = document.getElementById("stockCards");

  if (!container) return;

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  container.innerHTML = bloodGroups
    .map((group) => {
      const units = stock[group] || 0;
      const status =
        units > 10 ? "✅ Good" : units > 5 ? "⚠️ Low" : "🔴 Critical";
      const color = units > 10 ? "#27ae60" : units > 5 ? "#f39c12" : "#e74c3c";

      return `
            <div style="background: #f8f9fa; padding: 1.2rem; border-radius: 10px; text-align: center; border-left: 4px solid ${color};">
                <div style="font-size: 1.8rem; font-weight: bold; color: #c41e3a;">${group}</div>
                <div style="font-size: 2rem; font-weight: bold; color: ${color};">${units}</div>
                <div style="font-size: 0.9rem; color: #666;">units available</div>
                <div style="margin-top: 0.5rem; font-weight: 600; color: ${color};">${status}</div>
            </div>
        `;
    })
    .join("");
}

function renderStockTable() {
  const stock = getBloodStock();
  const tbody = document.getElementById("stockTableBody");

  if (!tbody) return;

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  tbody.innerHTML = bloodGroups
    .map((group) => {
      const units = stock[group] || 0;
      const status = units > 10 ? "Good" : units > 5 ? "Low" : "Critical";
      const statusColor =
        units > 10 ? "#27ae60" : units > 5 ? "#f39c12" : "#e74c3c";

      return `
            <tr>
                <td><span class="blood-badge ${group.replace("+", "").replace("-", "")}">${group}</span></td>
                <td><strong>${units}</strong> units</td>
                <td><span style="color: ${statusColor}; font-weight: 600;">${status}</span></td>
                <td>
                    <button class="action-btn approve" onclick="handleAddStock('${group}')">➕ Add</button>
                    <button class="action-btn reject" onclick="handleRemoveStock('${group}')">➖ Remove</button>
                </td>
            </tr>
        `;
    })
    .join("");
}

function handleAddStock(bloodGroup) {
  const units = prompt(`Enter units to add for ${bloodGroup}:`, "1");
  if (units && !isNaN(units) && parseInt(units) > 0) {
    const stock = getBloodStock();
    stock[bloodGroup] = (stock[bloodGroup] || 0) + parseInt(units);
    saveBloodStock(stock);
    renderStockTable();
    renderStockCards();
    showAdminMessage(`✅ Added ${units} unit(s) of ${bloodGroup}`, "success");
  }
}

function handleRemoveStock(bloodGroup) {
  const stock = getBloodStock();
  const current = stock[bloodGroup] || 0;

  if (current === 0) {
    showAdminMessage(`❌ No stock available for ${bloodGroup}`, "error");
    return;
  }

  const units = prompt(
    `Enter units to remove for ${bloodGroup} (Current: ${current}):`,
    "1",
  );
  if (units && !isNaN(units) && parseInt(units) > 0) {
    const removeUnits = parseInt(units);
    if (removeUnits > current) {
      showAdminMessage(
        `❌ Cannot remove ${removeUnits} units. Only ${current} available.`,
        "error",
      );
      return;
    }
    stock[bloodGroup] = current - removeUnits;
    saveBloodStock(stock);
    renderStockTable();
    renderStockCards();
    showAdminMessage(
      `✅ Removed ${removeUnits} unit(s) of ${bloodGroup}`,
      "success",
    );
  }
}

// ============================================
// ADMIN USERS MANAGEMENT
// ============================================

function loadUsersManagement() {
  checkAdminSession();

  const adminName = localStorage.getItem("adminName") || "Admin";
  const nameElement = document.getElementById("adminName");
  if (nameElement) nameElement.textContent = adminName;

  const donors = getDonors();
  const countElement = document.getElementById("userCount");
  if (countElement) countElement.textContent = donors.length;

  renderUsersTable(donors);
}

function renderUsersTable(users) {
  const tbody = document.getElementById("usersTableBody");

  if (!tbody) return;

  if (!users) users = getDonors();

  if (users.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" style="text-align: center; color: #999;">No users found</td></tr>';
    return;
  }

  tbody.innerHTML = users
    .map(
      (user, index) => `
        <tr>
            <td>${index + 1}</td>
            <td><strong>${user.fullName}</strong></td>
            <td>${user.email}</td>
            <td>${user.phone || "N/A"}</td>
            <td><span class="status-badge ${user.status || "pending"}">${(user.status || "pending").charAt(0).toUpperCase() + (user.status || "pending").slice(1)}</span></td>
            <td>
                <button class="action-btn view" onclick="viewDonor(${user.id})">👁️ View</button>
                <button class="action-btn delete" onclick="handleDeleteDonor(${user.id})">🗑️ Delete</button>
            </td>
        </tr>
    `,
    )
    .join("");
}

function filterUsers() {
  const searchTerm = document
    .getElementById("searchUser")
    .value.toLowerCase()
    .trim();
  const status = document.getElementById("filterUserStatus").value;

  let users = getDonors();

  if (searchTerm) {
    users = users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(searchTerm) ||
        u.email.toLowerCase().includes(searchTerm) ||
        (u.phone && u.phone.includes(searchTerm)),
    );
  }

  if (status) {
    users = users.filter((u) => (u.status || "pending") === status);
  }

  renderUsersTable(users);
}

// ============================================
// MODAL FUNCTIONS
// ============================================

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("active");
}

// Close modal when clicking outside
window.onclick = function (event) {
  if (event.target.classList && event.target.classList.contains("modal")) {
    event.target.classList.remove("active");
  }
};

// ============================================
// ADMIN MESSAGE FUNCTIONS
// ============================================

function showAdminMessage(text, type) {
  const msgDiv = document.getElementById("message");
  if (!msgDiv) return;

  msgDiv.textContent = text;
  msgDiv.className = `message ${type}`;
  msgDiv.style.display = "block";

  setTimeout(() => {
    msgDiv.style.display = "none";
  }, 5000);
}

// ============================================
// AUTO-LOAD BASED ON PAGE
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  // Check which page we're on and load appropriate function
  const currentPage = window.location.pathname.split("/").pop();

  if (currentPage === "admin-dashboard.html") {
    loadAdminDashboard();
  } else if (currentPage === "admin-donors.html") {
    loadDonorsTable();
  } else if (currentPage === "admin-requests.html") {
    loadRequestsTable();
  } else if (currentPage === "admin-stock.html") {
    loadStockManagement();
  } else if (currentPage === "admin-users.html") {
    loadUsersManagement();
  }
});
// ============================================
// ADMIN MESSAGE - Using the global confirmation
// ============================================

function showAdminMessage(text, type) {
  // Use the global confirmation message function
  if (typeof showConfirmationMessage === "function") {
    showConfirmationMessage(text, type);
  } else {
    // Fallback for older browsers
    const msgDiv = document.getElementById("message");
    if (msgDiv) {
      msgDiv.textContent = text;
      msgDiv.className = `message ${type}`;
      msgDiv.style.display = "block";
      setTimeout(() => {
        msgDiv.style.display = "none";
      }, 5000);
    }
  }
}
