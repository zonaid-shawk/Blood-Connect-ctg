// ============================================
// DATA STORAGE FUNCTIONS
// ============================================

// Get all donors from localStorage
function getDonors() {
  return JSON.parse(localStorage.getItem("bloodDonors") || "[]");
}

// Save donors to localStorage
function saveDonors(donors) {
  localStorage.setItem("bloodDonors", JSON.stringify(donors));
}

// Get all blood requests
function getRequests() {
  return JSON.parse(localStorage.getItem("bloodRequests") || "[]");
}

// Save blood requests
function saveRequests(requests) {
  localStorage.setItem("bloodRequests", JSON.stringify(requests));
}

// Get blood stock
function getBloodStock() {
  const defaultStock = {
    "A+": 10,
    "A-": 5,
    "B+": 8,
    "B-": 3,
    "AB+": 4,
    "AB-": 2,
    "O+": 15,
    "O-": 7,
  };
  return JSON.parse(
    localStorage.getItem("bloodStock") || JSON.stringify(defaultStock),
  );
}

// Save blood stock
function saveBloodStock(stock) {
  localStorage.setItem("bloodStock", JSON.stringify(stock));
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function sendMailToAddress(email, subject, body) {
  if (!email || !validateEmail(email)) return false;

  const mailtoLink = document.createElement("a");
  mailtoLink.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  mailtoLink.style.display = "none";
  document.body.appendChild(mailtoLink);
  mailtoLink.click();
  mailtoLink.remove();

  return true;
}

function getDonorPrintPageUrl(donorId) {
  const isAdminPage = window.location.href.includes("/admin/");
  const printPagePath = isAdminPage
    ? "../donor-print.html"
    : "donor-print.html";
  return new URL(
    `${printPagePath}?donorId=${encodeURIComponent(donorId)}`,
    window.location.href,
  ).toString();
}

function sendDonorApprovalEmail(donor) {
  if (!donor || !donor.email || !validateEmail(donor.email)) return false;

  const printUrl = getDonorPrintPageUrl(donor.id);
  const subject = "Your donor registration has been approved";
  const body =
    `Hello ${donor.fullName},\n\n` +
    "Congratulations! Your donor registration has been approved.\n\n" +
    `Donor ID: ${donor.donorId || donor.id}\n` +
    `Blood Group: ${donor.bloodGroup}\n\n` +
    "You can print your donor registration slip here:\n" +
    `${printUrl}\n\n` +
    "Thank you for being a lifesaving donor.";

  return sendMailToAddress(donor.email, subject, body);
}

function openSinglePrintWindow(title, content) {
  const printWindow = window.open("", "_blank", "width=900,height=900");
  if (!printWindow) return;

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>${title}</title>
        <style>
          html, body {
            margin: 0;
            padding: 0;
            background: #fff;
            font-family: Arial, sans-serif;
            color: #111;
          }
          body {
            display: flex;
            justify-content: center;
            align-items: flex-start;
            padding: 24px;
          }
          .print-only-slip {
            width: 100%;
            max-width: 700px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 12px;
            padding: 24px;
            box-sizing: border-box;
          }
          .print-card {
            background: white;
            border: none;
            border-radius: 0;
            box-shadow: none;
            padding: 0;
          }
          .print-card h2 {
            margin: 0 0 16px;
            text-align: center;
            color: #335c67;
          }
          .request-detail-item {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            padding: 10px 0;
            border-bottom: 1px solid #f0f0f0;
          }
          .request-detail-item strong {
            min-width: 150px;
            color: #335c67;
          }
          @media print {
            body { padding: 0; }
            .print-only-slip { border: none; max-width: none; }
          }
        </style>
      </head>
      <body>
        <div class="print-only-slip">${content}</div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  setTimeout(() => {
    try {
      printWindow.focus();
      printWindow.print();
    } catch (error) {
      // Ignore print errors in unsupported environments.
    }
  }, 300);
}

function openPrintPopup(title, content) {
  const existing = document.getElementById("submissionPrintPopup");
  if (existing) existing.remove();

  const popup = document.createElement("div");
  popup.id = "submissionPrintPopup";
  popup.innerHTML = `
    <div class="submission-print-overlay"></div>
    <div class="submission-print-box">
      <div class="submission-print-header">
        <h3>${title}</h3>
        <button type="button" class="close-print-popup" aria-label="Close">✕</button>
      </div>
      <div class="submission-print-body">${content}</div>
      <div class="submission-print-actions">
        <button type="button" class="btn btn-primary" data-action="print">🖨️ Print</button>
        <button type="button" class="btn btn-secondary" data-action="close">Close</button>
      </div>
    </div>
  `;

  document.body.appendChild(popup);

  popup.querySelector("[data-action='print']").addEventListener("click", () => {
    const printableContent = popup.querySelector(
      ".submission-print-body",
    ).innerHTML;
    popup.remove();
    openSinglePrintWindow(title, printableContent);
  });

  popup.querySelector("[data-action='close']").addEventListener("click", () => {
    popup.remove();
  });

  popup.querySelector(".close-print-popup").addEventListener("click", () => {
    popup.remove();
  });
}

function renderDonorPrintHtml(donor) {
  return `
    <div class="print-card">
      <h2>Donor Registration Slip</h2>
      <div class="request-detail-item"><strong>User ID:</strong> ${donor.donorId || donor.id}</div>
      <div class="request-detail-item"><strong>Name:</strong> ${donor.fullName}</div>
      <div class="request-detail-item"><strong>Email:</strong> ${donor.email}</div>
      <div class="request-detail-item"><strong>Phone:</strong> ${donor.phone}</div>
      <div class="request-detail-item"><strong>Blood Group:</strong> ${donor.bloodGroup}</div>
      <div class="request-detail-item"><strong>Age:</strong> ${donor.age}</div>
      <div class="request-detail-item"><strong>Gender:</strong> ${donor.gender}</div>
      <div class="request-detail-item"><strong>City:</strong> ${donor.city}</div>
      <div class="request-detail-item"><strong>Address:</strong> ${donor.address || "N/A"}</div>
      <div class="request-detail-item"><strong>Last Donation:</strong> ${donor.lastDonation || "N/A"}</div>
      <div class="request-detail-item"><strong>Status:</strong> ${donor.status}</div>
      <div class="request-detail-item"><strong>Registered:</strong> ${new Date(donor.registeredAt).toLocaleString()}</div>
    </div>
  `;
}

function renderRequestPrintHtml(request) {
  return `
    <div class="print-card">
      <h2>Blood Request Slip</h2>
      <div class="request-detail-item"><strong>Request ID:</strong> ${request.requestId}</div>
      <div class="request-detail-item"><strong>Patient Name:</strong> ${request.patientName}</div>
      <div class="request-detail-item"><strong>Email:</strong> ${request.email || "N/A"}</div>
      <div class="request-detail-item"><strong>Blood Group:</strong> ${request.bloodGroup}</div>
      <div class="request-detail-item"><strong>Hospital:</strong> ${request.hospital}</div>
      <div class="request-detail-item"><strong>City:</strong> ${request.city}</div>
      <div class="request-detail-item"><strong>Contact:</strong> ${request.contact}</div>
      <div class="request-detail-item"><strong>Urgency:</strong> ${request.urgency}</div>
      <div class="request-detail-item"><strong>Units Required:</strong> ${request.units || 1}</div>
      <div class="request-detail-item"><strong>Notes:</strong> ${request.notes || "N/A"}</div>
      <div class="request-detail-item"><strong>Status:</strong> ${request.status}</div>
      <div class="request-detail-item"><strong>Submitted:</strong> ${new Date(request.date).toLocaleString()}</div>
    </div>
  `;
}

// ============================================
// DONOR REGISTRATION
// ============================================

function registerDonor(event) {
  event.preventDefault();

  // Get form values
  const donor = {
    id: Date.now(),
    donorId: "DONOR-" + Date.now().toString().slice(-6),
    fullName: document.getElementById("fullName").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    bloodGroup: document.getElementById("bloodGroup").value,
    age: parseInt(document.getElementById("age").value),
    gender: document.getElementById("gender").value,
    city: document.getElementById("city").value.trim(),
    address: document.getElementById("address").value.trim(),
    lastDonation: document.getElementById("lastDonation").value,
    isAvailable: document.getElementById("isAvailable").checked,
    status: "pending", // pending, approved, rejected
    registeredAt: new Date().toISOString(),
    totalDonations: 0,
  };

  // Validation
  if (
    !donor.fullName ||
    !donor.email ||
    !donor.phone ||
    !donor.bloodGroup ||
    !donor.age ||
    !donor.city
  ) {
    showMessage("Please fill in all required fields!", "error");
    return false;
  }

  if (!validateEmail(donor.email)) {
    showMessage(
      "Please enter a valid email address for donor registration.",
      "error",
    );
    return false;
  }

  if (!/^[A-Za-z .'-]+$/.test(donor.fullName)) {
    showMessage(
      "Full name can only contain letters, spaces, dots, apostrophes, and hyphens.",
      "error",
    );
    return false;
  }

  if (!/^[0-9+()\-\s]{10,15}$/.test(donor.phone)) {
    showMessage(
      "Phone number must contain only digits and valid phone symbols.",
      "error",
    );
    return false;
  }

  if (donor.age < 18 || donor.age > 65) {
    showMessage("Age must be between 18 and 65 years!", "error");
    return false;
  }

  // Check if email already registered
  const donors = getDonors();
  if (donors.some((d) => d.email === donor.email)) {
    showMessage("This email is already registered!", "error");
    return false;
  }

  // Save donor
  donors.push(donor);
  saveDonors(donors);
  localStorage.setItem("latestDonorId", donor.donorId);

  // Show success and print popup
  showMessage(
    "✅ Registration successful! Your account is pending admin approval.",
    "success",
  );
  document.getElementById("donorForm").reset();
  openPrintPopup("Donor Registration Confirmed", renderDonorPrintHtml(donor));

  // Update stats
  updateStats();

  return false;
}

// ============================================
// BLOOD REQUEST
// ============================================

function submitBloodRequest(event) {
  event.preventDefault();

  const hospitalSelect = document.getElementById("hospital");
  const hospitalCustom = document.getElementById("hospitalCustom");
  const selectedHospital = hospitalSelect ? hospitalSelect.value : "";
  const hospitalValue =
    selectedHospital === "Other Hospital"
      ? hospitalCustom
        ? hospitalCustom.value.trim()
        : ""
      : selectedHospital;

  const request = {
    id: Date.now(),
    requestId: "REQ-" + Date.now().toString().slice(-6),
    patientName: document.getElementById("patientName").value.trim(),
    email: document.getElementById("requesterEmail").value.trim(),
    bloodGroup: document.getElementById("bloodGroup").value,
    hospital: hospitalValue,
    city: document.getElementById("city").value.trim(),
    contact: document.getElementById("contact").value.trim(),
    urgency: document.getElementById("urgency").value,
    units: parseInt(document.getElementById("units").value) || 1,
    notes: document.getElementById("notes").value.trim(),
    status: "Pending",
    date: new Date().toISOString(),
  };

  // Validation
  if (
    !request.patientName ||
    !request.email ||
    !request.bloodGroup ||
    !request.hospital ||
    !request.city ||
    !request.contact
  ) {
    showMessage("Please fill in all required fields!", "error");
    return false;
  }

  if (!validateEmail(request.email)) {
    showMessage(
      "Please enter a valid email address for the blood request.",
      "error",
    );
    return false;
  }

  if (!/^[A-Za-z .'-]+$/.test(request.patientName)) {
    showMessage(
      "Patient name can only contain letters, spaces, dots, apostrophes, and hyphens.",
      "error",
    );
    return false;
  }

  if (!/^[0-9+()\-\s]{10,15}$/.test(request.contact)) {
    showMessage(
      "Contact number must contain only digits and valid phone symbols.",
      "error",
    );
    return false;
  }

  // Save request
  const requests = getRequests();
  requests.push(request);
  saveRequests(requests);

  // Store the last submitted request id for the print page.
  localStorage.setItem("latestRequestId", request.requestId);

  const requestConfirmationSent = sendMailToAddress(
    request.email,
    "Blood request submitted successfully",
    `Hello,\n\nYour blood request has been submitted successfully.\n\nRequest ID: ${request.requestId}\nBlood Group: ${request.bloodGroup}\nHospital: ${request.hospital}\nCity: ${request.city}\n\nPlease keep this ID for follow-up.`,
  );

  // Show success and print popup.
  showMessage(
    "✅ Blood request submitted successfully! Your request ID is " +
      request.requestId +
      "." +
      (requestConfirmationSent
        ? " A confirmation email has been prepared."
        : ""),
    "success",
  );
  document.getElementById("requestForm").reset();
  openPrintPopup("Blood Request Submitted", renderRequestPrintHtml(request));

  // Update stats
  updateStats();

  return false;
}

function goToRequestSearch() {
  const input = document.getElementById("homeRequestId");
  const value = input ? input.value.trim() : "";

  if (!value) {
    alert("Please enter a Request ID first.");
    return;
  }

  window.location.href =
    "search-donors.html?requestId=" + encodeURIComponent(value);
}

function getDonorById(donorId) {
  const donors = getDonors();
  return donors.find(
    (d) =>
      String(d.id) === String(donorId) ||
      (d.donorId || "").toLowerCase() === String(donorId).trim().toLowerCase(),
  );
}

function getRequestById(requestId) {
  const requests = getRequests();
  return requests.find(
    (r) =>
      (r.requestId || "REQ-" + r.id).toLowerCase() ===
      String(requestId).trim().toLowerCase(),
  );
}

function renderRequestStatusResult(request, donors) {
  const result = document.getElementById("requestStatusResult");
  if (!result) return;

  const normalizedStatus = (request.status || "Pending").toLowerCase();

  if (normalizedStatus === "pending") {
    result.innerHTML = `
            <div class="no-results">
                <p>⏳ Please wait for admin approval.</p>
            </div>
        `;
    return;
  }

  if (
    normalizedStatus === "rejected" ||
    normalizedStatus === "cancelled" ||
    normalizedStatus === "fulfilled"
  ) {
    result.innerHTML = `
            <div class="no-results">
                <p>😔 Sorry, unable manage.</p>
            </div>
        `;
    return;
  }

  if (normalizedStatus !== "approved") {
    result.innerHTML = `
            <div class="no-results">
                <p>😔 Sorry, unable manage.</p>
            </div>
        `;
    return;
  }

  if (!donors.length) {
    result.innerHTML = `
            <div class="no-results">
                <p>😔 Sorry, unable manage.</p>
            </div>
        `;
    return;
  }

  result.innerHTML = `
        <h3>Matching donors for ${request.bloodGroup}</h3>
        <div class="results-grid">
            ${donors
              .map(
                (donor) => `
                <div class="donor-card">
                    <div class="donor-header">
                        <h3>${donor.fullName}</h3>
                        <span class="blood-badge ${donor.bloodGroup.replace("+", "").replace("-", "")}">${donor.bloodGroup}</span>
                    </div>
                    <div class="donor-body">
                        <p><span class="icon">📍</span> ${donor.city || "N/A"}</p>
                        <p><span class="icon">📞</span> ${donor.phone || "N/A"}</p>
                        <p><span class="icon">📧</span> ${donor.email}</p>
                        <p><span class="icon">🎂</span> ${donor.age || "N/A"} years</p>
                        <p><span class="icon">❤️</span> ${donor.totalDonations || 0} donations</p>
                    </div>
                    <div class="donor-footer">
                        <button onclick="contactDonor('${donor.phone}')" class="btn btn-sm btn-primary">📞 Contact</button>
                    </div>
                </div>
            `,
              )
              .join("")}
        </div>
    `;
}

function searchRequestStatus() {
  const requestId = document.getElementById("requestIdSearch")?.value.trim();
  const result = document.getElementById("requestStatusResult");
  if (!requestId || !result) return;

  const request = getRequestById(requestId);
  if (!request) {
    result.innerHTML = `
            <div class="no-results">
                <p>❌ Request ID not found.</p>
            </div>
        `;
    return;
  }

  const donorMatches = getDonors().filter((d) => {
    const approved = d.status === "approved" || d.status === "Approved";
    const available = d.isAvailable === true;
    const sameBlood = d.bloodGroup === request.bloodGroup;
    const sameCity =
      !request.city ||
      !d.city ||
      d.city.toLowerCase().includes(request.city.toLowerCase());
    return approved && available && sameBlood && sameCity;
  });

  renderRequestStatusResult(request, donorMatches);
}

// ============================================
// SEARCH DONORS
// ============================================

function enforceApprovedRequestAccess() {
  const results = document.getElementById("results");
  const requestStatusResult = document.getElementById("requestStatusResult");
  const requestIdInput = document.getElementById("requestIdSearch");
  const searchFilters = document.querySelector(".search-filters");

  const requestId =
    new URLSearchParams(window.location.search).get("requestId") ||
    (requestIdInput ? requestIdInput.value.trim() : "");

  if (!requestId) {
    if (results) {
      results.innerHTML = `
        <div class="no-results">
          <p>🚫 Access denied. Only approved request ID holders can view donor information.</p>
        </div>
      `;
    }
    if (searchFilters) {
      searchFilters.style.display = "none";
    }
    return;
  }

  const request = getRequestById(requestId);
  if (!request || (request.status || "").toLowerCase() !== "approved") {
    if (results) {
      results.innerHTML = `
        <div class="no-results">
          <p>🚫 Access denied. Only approved request ID holders can view donor information.</p>
        </div>
      `;
    }
    if (requestStatusResult) {
      renderRequestStatusResult(request || { status: "Pending" }, []);
    }
    if (searchFilters) {
      searchFilters.style.display = "none";
    }
    return;
  }

  if (searchFilters) {
    searchFilters.style.display = "flex";
  }
}

function searchDonors() {
  const requestId = new URLSearchParams(window.location.search).get(
    "requestId",
  );
  if (!requestId) {
    const results = document.getElementById("results");
    if (results) {
      results.innerHTML = `
        <div class="no-results">
          <p>🚫 Access denied. Only approved request ID holders can view donor information.</p>
        </div>
      `;
    }
    return;
  }

  const request = getRequestById(requestId);
  if (!request || (request.status || "").toLowerCase() !== "approved") {
    const results = document.getElementById("results");
    if (results) {
      results.innerHTML = `
        <div class="no-results">
          <p>🚫 Access denied. Only approved request ID holders can view donor information.</p>
        </div>
      `;
    }
    return;
  }

  const bloodGroup = document.getElementById("searchBloodGroup").value;
  const city = document.getElementById("searchCity").value.toLowerCase().trim();

  let donors = getDonors();

  // Filter only approved donors
  donors = donors.filter(
    (d) => d.status === "approved" && d.isAvailable === true,
  );

  // Apply filters
  if (bloodGroup) {
    donors = donors.filter((d) => d.bloodGroup === bloodGroup);
  }
  if (city) {
    donors = donors.filter(
      (d) => d.city && d.city.toLowerCase().includes(city),
    );
  }

  // Display results
  displayResults(donors);
}

function displayResults(donors) {
  const container = document.getElementById("results");

  if (!container) return;

  if (donors.length === 0) {
    container.innerHTML = `
            <div class="no-results">
                <p>😔 No donors found matching your criteria.</p>
                <p>Try different filters or check back later.</p>
            </div>
        `;
    return;
  }

  container.innerHTML = donors
    .map(
      (donor) => `
        <div class="donor-card">
            <div class="donor-header">
                <h3>${donor.fullName}</h3>
                <span class="blood-badge ${donor.bloodGroup.replace("+", "").replace("-", "")}">${donor.bloodGroup}</span>
            </div>
            <div class="donor-body">
                <p><span class="icon">📍</span> ${donor.city || "N/A"}</p>
                <p><span class="icon">📞</span> ${donor.phone || "N/A"}</p>
                <p><span class="icon">📧</span> ${donor.email}</p>
                <p><span class="icon">🎂</span> ${donor.age || "N/A"} years</p>
                <p><span class="icon">❤️</span> ${donor.totalDonations || 0} donations</p>
                ${donor.lastDonation ? `<p><span class="icon">📅</span> Last donation: ${formatDate(donor.lastDonation)}</p>` : ""}
            </div>
            <div class="donor-footer">
                <button onclick="contactDonor('${donor.phone}')" class="btn btn-sm btn-primary">
                    📞 Request Contact
                </button>
            </div>
        </div>
    `,
    )
    .join("");
}

function resetSearch() {
  document.getElementById("searchBloodGroup").value = "";
  document.getElementById("searchCity").value = "";
  searchDonors();
}

function contactDonor(phone) {
  if (confirm("Request contact information for this donor?")) {
    alert(
      `📞 Donor's contact: ${phone}\n\nWe will also notify the donor about your interest.`,
    );
  }
}

// ============================================
// DASHBOARD
// ============================================

function loadDashboard() {
  const donors = getDonors();
  const requests = getRequests();
  const stock = getBloodStock();

  // Update stats
  const totalDonors = document.getElementById("dashDonors");
  const totalRequests = document.getElementById("dashRequests");
  const pendingRequests = document.getElementById("dashPending");
  const availableDonors = document.getElementById("dashAvailable");

  if (totalDonors) totalDonors.textContent = donors.length;
  if (totalRequests) totalRequests.textContent = requests.length;
  if (pendingRequests)
    pendingRequests.textContent = requests.filter(
      (r) => r.status === "Pending",
    ).length;
  if (availableDonors)
    availableDonors.textContent = donors.filter(
      (d) => d.status === "approved" && d.isAvailable,
    ).length;

  // Show recent requests
  const recentRequests = requests.slice(-5).reverse();
  const requestsContainer = document.getElementById("recentRequests");
  if (requestsContainer) {
    if (recentRequests.length === 0) {
      requestsContainer.innerHTML = '<p class="empty">No requests yet</p>';
    } else {
      requestsContainer.innerHTML = recentRequests
        .map(
          (r) => `
                <div class="request-item">
                    <div>
                        <strong>${r.patientName}</strong>
                        <span class="blood-badge small ${r.bloodGroup.replace("+", "").replace("-", "")}">${r.bloodGroup}</span>
                    </div>
                    <div>
                        <span class="urgency-badge ${r.urgency.toLowerCase()}">${r.urgency}</span>
                        <span class="status-badge ${r.status.toLowerCase()}">${r.status}</span>
                    </div>
                    <div class="request-meta">
                        <span>🏥 ${r.hospital}</span>
                        <span>📍 ${r.city}</span>
                    </div>
                </div>
            `,
        )
        .join("");
    }
  }

  // Show blood stock
  const stockContainer = document.getElementById("bloodStock");
  if (stockContainer) {
    stockContainer.innerHTML = Object.entries(stock)
      .map(
        ([group, units]) => `
            <div class="stock-item">
                <span class="blood-badge ${group.replace("+", "").replace("-", "")}">${group}</span>
                <div class="stock-bar">
                    <div class="stock-fill" style="width: ${Math.min(units * 5, 100)}%; background: ${getStockColor(units)}"></div>
                </div>
                <span class="stock-count">${units} units</span>
            </div>
        `,
      )
      .join("");
  }

  // Show recent donors
  const recentDonors = donors.slice(-5).reverse();
  const donorsContainer = document.getElementById("recentDonors");
  if (donorsContainer) {
    if (recentDonors.length === 0) {
      donorsContainer.innerHTML =
        '<p class="empty">No donors registered yet</p>';
    } else {
      donorsContainer.innerHTML = recentDonors
        .map((d) => {
          const status = d.status || "pending";
          return `
                    <div class="donor-item">
                        <span>${d.fullName}</span>
                        <span class="blood-badge small ${d.bloodGroup.replace("+", "").replace("-", "")}">${d.bloodGroup}</span>
                        <span>📍 ${d.city || "N/A"}</span>
                        <span class="status-badge ${status}">
                            ${status === "approved" ? "✅ Approved" : status === "pending" ? "⏳ Pending" : "❌ Rejected"}
                        </span>
                    </div>
                `;
        })
        .join("");
    }
  }
}

// ============================================
// HOME PAGE STATS
// ============================================

function updateStats() {
  const donors = getDonors();
  const requests = getRequests();

  const totalDonors = document.getElementById("totalDonors");
  const totalRequests = document.getElementById("totalRequests");
  const totalDonations = document.getElementById("totalDonations");

  if (totalDonors) totalDonors.textContent = donors.length;
  if (totalRequests) totalRequests.textContent = requests.length;
  if (totalDonations) {
    const total = donors.reduce((sum, d) => sum + (d.totalDonations || 0), 0);
    totalDonations.textContent = total * 3; // Each donation saves 3 lives
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function showMessage(text, type) {
  const msgDiv = document.getElementById("message");
  if (!msgDiv) return;

  msgDiv.textContent = text;
  msgDiv.className = `message ${type}`;
  msgDiv.style.display = "block";

  setTimeout(() => {
    msgDiv.style.display = "none";
  }, 5000);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStockColor(units) {
  if (units > 10) return "#28a745";
  if (units > 5) return "#ffc107";
  return "#dc3545";
}

// ============================================
// SEED SAMPLE DATA
// ============================================

function seedSampleData() {
  // Check if we already have data
  if (getDonors().length > 0) return;

  const sampleDonors = [
    {
      id: 1,
      fullName: "Rahul Ahmed",
      email: "rahul@example.com",
      phone: "01711111111",
      bloodGroup: "A+",
      age: 25,
      gender: "Male",
      city: "Dhaka",
      address: "Mirpur, Dhaka",
      lastDonation: "2026-01-15",
      isAvailable: true,
      status: "approved",
      registeredAt: "2026-01-01T10:00:00",
      totalDonations: 3,
    },
    {
      id: 2,
      fullName: "Sumi Akter",
      email: "sumi@example.com",
      phone: "01722222222",
      bloodGroup: "O+",
      age: 22,
      gender: "Female",
      city: "Chittagong",
      address: "Agrabad, Chittagong",
      lastDonation: "2026-02-01",
      isAvailable: true,
      status: "approved",
      registeredAt: "2026-01-15T14:30:00",
      totalDonations: 2,
    },
    {
      id: 3,
      fullName: "Kamal Hasan",
      email: "kamal@example.com",
      phone: "01733333333",
      bloodGroup: "B+",
      age: 30,
      gender: "Male",
      city: "Dhaka",
      address: "Gulshan, Dhaka",
      lastDonation: "2025-12-10",
      isAvailable: true,
      status: "pending",
      registeredAt: "2025-12-01T09:00:00",
      totalDonations: 5,
    },
    {
      id: 4,
      fullName: "Nadia Rahman",
      email: "nadia@example.com",
      phone: "01744444444",
      bloodGroup: "AB-",
      age: 28,
      gender: "Female",
      city: "Chittagong",
      address: "Halishahar, Chittagong",
      lastDonation: null,
      isAvailable: true,
      status: "pending",
      registeredAt: "2026-02-15T11:00:00",
      totalDonations: 0,
    },
  ];

  saveDonors(sampleDonors);

  const sampleRequests = [
    {
      id: 101,
      requestId: "REQ-001",
      patientName: "Fatima Begum",
      bloodGroup: "A+",
      hospital: "Dhaka Medical College",
      city: "Dhaka",
      contact: "01755555555",
      urgency: "Critical",
      units: 2,
      notes: "Emergency surgery needed",
      status: "Pending",
      date: "2026-02-10T08:00:00",
    },
    {
      id: 102,
      requestId: "REQ-002",
      patientName: "Md. Karim",
      bloodGroup: "O-",
      hospital: "Chittagong Medical",
      city: "Chittagong",
      contact: "01766666666",
      urgency: "Urgent",
      units: 1,
      notes: "",
      status: "Pending",
      date: "2026-02-12T10:30:00",
    },
    {
      id: 103,
      requestId: "REQ-003",
      patientName: "Sonia Akhter",
      bloodGroup: "B+",
      hospital: "Square Hospital",
      city: "Dhaka",
      contact: "01777777777",
      urgency: "Normal",
      units: 1,
      notes: "For routine surgery",
      status: "Fulfilled",
      date: "2026-02-05T15:00:00",
    },
  ];

  saveRequests(sampleRequests);
}

// ============================================
// ADMIN FUNCTIONS (Used by admin.js)
// ============================================

function approveDonor(donorId) {
  let donors = getDonors();
  const index = donors.findIndex((d) => d.id === donorId);

  if (index !== -1) {
    donors[index].status = "approved";
    donors[index].isAvailable = true;
    saveDonors(donors);
    sendDonorApprovalEmail(donors[index]);
    return true;
  }
  return false;
}

function rejectDonor(donorId) {
  let donors = getDonors();
  const index = donors.findIndex((d) => d.id === donorId);

  if (index !== -1) {
    donors[index].status = "rejected";
    donors[index].isAvailable = false;
    saveDonors(donors);
    return true;
  }
  return false;
}

function deleteDonor(donorId) {
  let donors = getDonors();
  donors = donors.filter((d) => d.id !== donorId);
  saveDonors(donors);
  return true;
}

function getAdminStats() {
  const donors = getDonors();
  const requests = getRequests();
  const stock = getBloodStock();

  return {
    totalDonors: donors.length,
    totalRequests: requests.length,
    pendingRequests: requests.filter((r) => r.status === "Pending").length,
    availableDonors: donors.filter(
      (d) => d.status === "approved" && d.isAvailable,
    ).length,
    pendingDonors: donors.filter((d) => d.status === "pending").length,
    bloodStock: stock,
  };
}

// ============================================
// INITIALIZATION
// ============================================

// Seed sample data when page loads
function setupNavigationToggle() {
  const nav = document.querySelector("nav");
  if (nav && !nav.querySelector(".nav-toggle")) {
    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "nav-toggle";
    toggleBtn.setAttribute("aria-label", "Toggle navigation");
    toggleBtn.innerHTML = "<span></span><span></span><span></span>";
    toggleBtn.addEventListener("click", () => {
      nav.classList.toggle("nav-open");
    });
    nav.insertBefore(toggleBtn, nav.firstChild);
  }

  const adminWrapper = document.querySelector(".admin-wrapper");
  if (adminWrapper && !adminWrapper.querySelector(".admin-nav-toggle")) {
    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "admin-nav-toggle";
    toggleBtn.setAttribute("aria-label", "Toggle admin navigation");
    toggleBtn.textContent = "☰";
    toggleBtn.addEventListener("click", () => {
      adminWrapper.classList.toggle("sidebar-open");
    });
    adminWrapper.insertBefore(toggleBtn, adminWrapper.firstChild);
  }
}

function renderDashboardDetail(type) {
  const detailBox = document.getElementById("dashboardDetails");
  if (!detailBox) return;

  const donors = getDonors();
  const requests = getRequests();
  let heading = "Details";
  let items = [];

  if (type === "donors") {
    heading = "Total Donors";
    items = donors.map(
      (d) => `
            <div class="detail-item">
                <div class="meta">
                    <strong>${d.fullName}</strong>
                    <span class="blood-badge ${d.bloodGroup.replace("+", "").replace("-", "")}">${d.bloodGroup}</span>
                    <small>${d.city || "N/A"}</small>
                </div>
                <span class="status-badge ${d.status || "pending"} detail-status">${(d.status || "pending").charAt(0).toUpperCase() + (d.status || "pending").slice(1)}</span>
            </div>
        `,
    );
  } else if (type === "requests") {
    heading = "Blood Requests";
    items = requests.map(
      (r) => `
            <div class="detail-item">
                <div class="meta">
                    <strong>${r.patientName}</strong>
                    <span class="blood-badge ${r.bloodGroup.replace("+", "").replace("-", "")}">${r.bloodGroup}</span>
                    <small>${r.hospital} • ${r.city}</small>
                </div>
                <span class="urgency-badge ${r.urgency.toLowerCase()} detail-status">${r.urgency}</span>
            </div>
        `,
    );
  } else if (type === "pending") {
    heading = "Pending Requests";
    const pendingRequests = requests.filter((r) => r.status === "Pending");
    items = pendingRequests.map(
      (r) => `
            <div class="detail-item">
                <div class="meta">
                    <strong>${r.patientName}</strong>
                    <span class="blood-badge ${r.bloodGroup.replace("+", "").replace("-", "")}">${r.bloodGroup}</span>
                    <small>${r.hospital} • ${r.city}</small>
                </div>
                <span class="status-badge pending detail-status">Pending</span>
            </div>
        `,
    );
  } else if (type === "available") {
    heading = "Available Donors";
    const available = donors.filter(
      (d) => d.status === "approved" && d.isAvailable,
    );
    items = available.map(
      (d) => `
            <div class="detail-item">
                <div class="meta">
                    <strong>${d.fullName}</strong>
                    <span class="blood-badge ${d.bloodGroup.replace("+", "").replace("-", "")}">${d.bloodGroup}</span>
                    <small>${d.city || "N/A"}</small>
                </div>
                <span class="status-badge approved detail-status">Available</span>
            </div>
        `,
    );
  } else if (type === "recentRequests") {
    heading = "Recent Blood Requests";
    items = requests
      .slice(-5)
      .reverse()
      .map(
        (r) => `
            <div class="detail-item">
                <div class="meta">
                    <strong>${r.patientName}</strong>
                    <span class="blood-badge ${r.bloodGroup.replace("+", "").replace("-", "")}">${r.bloodGroup}</span>
                    <small>${r.hospital}</small>
                </div>
                <span class="urgency-badge ${r.urgency.toLowerCase()} detail-status">${r.urgency}</span>
            </div>
        `,
      );
  } else if (type === "recentDonors") {
    heading = "Recent Donors";
    items = donors
      .slice(-5)
      .reverse()
      .map(
        (d) => `
            <div class="detail-item">
                <div class="meta">
                    <strong>${d.fullName}</strong>
                    <span class="blood-badge ${d.bloodGroup.replace("+", "").replace("-", "")}">${d.bloodGroup}</span>
                    <small>${d.city || "N/A"}</small>
                </div>
                <span class="status-badge ${d.status || "pending"} detail-status">${(d.status || "pending").charAt(0).toUpperCase() + (d.status || "pending").slice(1)}</span>
            </div>
        `,
      );
  } else if (type === "stock") {
    heading = "Blood Stock";
    const stock = getBloodStock();
    items = Object.entries(stock).map(
      ([group, units]) => `
            <div class="detail-item">
                <div class="meta">
                    <strong>${group}</strong>
                    <small>${units} units available</small>
                </div>
                <span class="detail-status" style="color: ${getStockColor(units)}; font-weight: 700;">${units}</span>
            </div>
        `,
    );
  }

  if (!items.length) {
    items = [
      `<div class="detail-item"><div class="meta"><strong>No data available</strong></div></div>`,
    ];
  }

  detailBox.classList.add("visible");
  detailBox.innerHTML = `
        <div class="detail-header">
            <h3>${heading}</h3>
            <button class="btn btn-sm btn-secondary" onclick="this.parentElement.parentElement.classList.remove('visible'); this.parentElement.parentElement.innerHTML = ''">Close</button>
        </div>
        <div class="detail-list">
            ${items.join("")}
        </div>
    `;
}

document.addEventListener("DOMContentLoaded", function () {
  setupNavigationToggle();
  setActiveNavigation();
  updateAdminNavigation();
  seedSampleData();
  updateStats();

  document
    .querySelectorAll(
      ".stat-card, .dashboard-card, .admin-stat-card, .admin-card",
    )
    .forEach((card) => {
      card.addEventListener("click", () => {
        document
          .querySelectorAll(
            ".stat-card, .dashboard-card, .admin-stat-card, .admin-card",
          )
          .forEach((item) => {
            item.classList.remove("card-selected");
          });
        card.classList.add("card-selected");

        const type = card.dataset.detail;
        if (type) {
          renderDashboardDetail(type);
        }
      });
    });

  // Load dashboard if on dashboard page
  if (document.getElementById("dashDonors")) {
    loadDashboard();
  }

  // Load search results if on search page
  if (document.getElementById("results")) {
    searchDonors();
  }
});
// ============================================
// GLOBAL ALERT / TOAST MESSAGES
// ============================================

function showConfirmationMessage(text, type, redirectUrl = null) {
  // Check if we have a message container
  let msgDiv = document.getElementById("confirmationMessage");

  // If not, create one
  if (!msgDiv) {
    msgDiv = document.createElement("div");
    msgDiv.id = "confirmationMessage";
    msgDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 99999;
            padding: 1.2rem 2.5rem;
            border-radius: 12px;
            font-size: 1.1rem;
            font-weight: 600;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            min-width: 300px;
            text-align: center;
            animation: slideDown 0.5s ease;
            display: none;
            max-width: 90%;
        `;
    document.body.appendChild(msgDiv);

    // Add animation
    const style = document.createElement("style");
    style.textContent = `
            @keyframes slideDown {
                from {
                    transform: translateX(-50%) translateY(-100px);
                    opacity: 0;
                }
                to {
                    transform: translateX(-50%) translateY(0);
                    opacity: 1;
                }
            }
            @keyframes slideUp {
                from {
                    transform: translateX(-50%) translateY(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(-50%) translateY(-100px);
                    opacity: 0;
                }
            }
        `;
    document.head.appendChild(style);
  }

  // Set message
  msgDiv.textContent = text;
  msgDiv.style.display = "block";

  // Set colors based on type
  if (type === "success") {
    msgDiv.style.background = "#d4edda";
    msgDiv.style.color = "#155724";
    msgDiv.style.border = "3px solid #2a9d8f";
  } else if (type === "error") {
    msgDiv.style.background = "#f8d7da";
    msgDiv.style.color = "#721c24";
    msgDiv.style.border = "3px solid #e76f51";
  } else if (type === "info") {
    msgDiv.style.background = "#d1ecf1";
    msgDiv.style.color = "#0c5460";
    msgDiv.style.border = "3px solid #335c67";
  } else {
    msgDiv.style.background = "#fff3cd";
    msgDiv.style.color = "#856404";
    msgDiv.style.border = "3px solid #ffc107";
  }

  // Auto dismiss after 4 seconds
  setTimeout(() => {
    msgDiv.style.animation = "slideUp 0.5s ease";
    setTimeout(() => {
      msgDiv.style.display = "none";
      msgDiv.style.animation = "slideDown 0.5s ease";

      // Redirect if URL provided
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    }, 500);
  }, 4000);
}

// Keep the dashboard in the top navigation only for logged-in admin users.
function isAdminLoggedIn() {
  return localStorage.getItem("adminLoggedIn") === "true";
}

function updateAdminNavigation() {
  const isAdminPage =
    window.location.pathname.includes("/admin/") ||
    window.location.pathname.endsWith("admin-dashboard.html");

  document.querySelectorAll("nav ul").forEach((navList) => {
    const adminItem = navList.querySelector("li.nav-admin");
    const dashboardItem = navList.querySelector("li.nav-dashboard");

    if (!adminItem) {
      if (dashboardItem) dashboardItem.remove();
      return;
    }

    if (!isAdminPage) {
      if (dashboardItem) dashboardItem.remove();
      return;
    }

    if (!dashboardItem) {
      const newDashboardItem = document.createElement("li");
      newDashboardItem.className = "nav-dashboard";
      newDashboardItem.innerHTML = '<a href="../dashboard.html">Dashboard</a>';
      navList.insertBefore(newDashboardItem, adminItem);
    }

    const currentDashboardItem = navList.querySelector("li.nav-dashboard");
    if (!currentDashboardItem) return;

    if (isAdminLoggedIn()) {
      currentDashboardItem.style.display = "";
      navList.insertBefore(currentDashboardItem, adminItem);
    } else {
      currentDashboardItem.style.display = "none";
    }
  });
}

function setActiveNavigation() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  document.querySelectorAll("nav a").forEach((link) => {
    const href = link.getAttribute("href") || "";
    const pageName = href.split("/").pop() || "index.html";
    const isMatch = pageName === currentPage;

    link.classList.toggle("active", isMatch);
  });
}

// ============================================
// ADMIN APPROVE/REJECT - Updated with confirmation
// ============================================

function handleApproveDonor(donorId) {
  if (!confirm("Approve this donor registration?")) return;

  let donors = getDonors();
  const index = donors.findIndex((d) => d.id === donorId);

  if (index !== -1) {
    donors[index].status = "approved";
    donors[index].isAvailable = true;
    saveDonors(donors);

    showConfirmationMessage(
      "✅ Donor Approved! 🎉\n" +
        donors[index].fullName +
        " is now an active donor.",
      "success",
    );

    if (document.getElementById("donorsTableBody")) loadDonorsTable();
    if (document.getElementById("pendingDonorsBody")) loadPendingDonors();
    updateStats();
  }
}

function handleRejectDonor(donorId) {
  if (!confirm("Reject this donor registration?")) return;

  let donors = getDonors();
  const index = donors.findIndex((d) => d.id === donorId);

  if (index !== -1) {
    donors[index].status = "rejected";
    donors[index].isAvailable = false;
    saveDonors(donors);

    showConfirmationMessage(
      "❌ Donor Rejected.\n" +
        donors[index].fullName +
        "'s registration has been rejected.",
      "error",
    );

    if (document.getElementById("donorsTableBody")) loadDonorsTable();
    if (document.getElementById("pendingDonorsBody")) loadPendingDonors();
    updateStats();
  }
}

function handleDeleteDonor(donorId) {
  if (!confirm("Are you sure you want to delete this donor permanently?"))
    return;

  let donors = getDonors();
  const donor = donors.find((d) => d.id === donorId);
  donors = donors.filter((d) => d.id !== donorId);
  saveDonors(donors);

  showConfirmationMessage(
    "🗑️ Donor Deleted!\n" +
      (donor ? donor.fullName : "Donor") +
      " has been removed.",
    "info",
  );

  if (document.getElementById("donorsTableBody")) loadDonorsTable();
  updateStats();
}

// ============================================
// ADMIN REQUEST FULFILL/CANCEL - Updated with confirmation
// ============================================

function handleFulfillRequest(requestId) {
  if (!confirm("Mark this blood request as fulfilled?")) return;

  let requests = getRequests();
  const index = requests.findIndex((r) => r.id === requestId);

  if (index !== -1) {
    requests[index].status = "Fulfilled";
    saveRequests(requests);

    const stock = getBloodStock();
    const bloodGroup = requests[index].bloodGroup;
    stock[bloodGroup] = (stock[bloodGroup] || 0) + (requests[index].units || 1);
    saveBloodStock(stock);

    showConfirmationMessage(
      "✅ Request Fulfilled! 🎉\nBlood stock updated for " +
        bloodGroup +
        ".\n" +
        requests[index].units +
        " unit(s) added.",
      "success",
    );

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

    showConfirmationMessage(
      "❌ Request Cancelled.\nRequest #" +
        (requests[index].requestId || requests[index].id) +
        " has been cancelled.",
      "error",
    );

    loadRequestsTable();
    updateStats();
  }
}

// ============================================
// ADMIN STOCK UPDATE - Updated with confirmation
// ============================================

function handleAddStock(bloodGroup) {
  const units = prompt(`Enter units to add for ${bloodGroup}:`, "1");
  if (units && !isNaN(units) && parseInt(units) > 0) {
    const stock = getBloodStock();
    stock[bloodGroup] = (stock[bloodGroup] || 0) + parseInt(units);
    saveBloodStock(stock);

    showConfirmationMessage(
      "✅ Stock Updated! 📦\nAdded " +
        units +
        " unit(s) of " +
        bloodGroup +
        ".\nTotal: " +
        stock[bloodGroup] +
        " units",
      "success",
    );

    renderStockTable();
    renderStockCards();
  }
}

function handleRemoveStock(bloodGroup) {
  const stock = getBloodStock();
  const current = stock[bloodGroup] || 0;

  if (current === 0) {
    showConfirmationMessage("❌ No stock available for " + bloodGroup, "error");
    return;
  }

  const units = prompt(
    `Enter units to remove for ${bloodGroup} (Current: ${current}):`,
    "1",
  );
  if (units && !isNaN(units) && parseInt(units) > 0) {
    const removeUnits = parseInt(units);
    if (removeUnits > current) {
      showConfirmationMessage(
        "❌ Cannot remove " +
          removeUnits +
          " units. Only " +
          current +
          " available.",
        "error",
      );
      return;
    }
    stock[bloodGroup] = current - removeUnits;
    saveBloodStock(stock);

    showConfirmationMessage(
      "✅ Stock Updated! 📦\nRemoved " +
        removeUnits +
        " unit(s) of " +
        bloodGroup +
        ".\nRemaining: " +
        stock[bloodGroup] +
        " units",
      "success",
    );

    renderStockTable();
    renderStockCards();
  }
}

// ============================================
// CONTACT DONOR - Updated with confirmation
// ============================================

function contactDonor(phone) {
  if (confirm("Request contact information for this donor?")) {
    showConfirmationMessage(
      "📞 Contact Request Sent!\nDonor's contact: " +
        phone +
        "\nWe will notify the donor about your interest.",
      "info",
    );
  }
}

// ============================================
// HOW IT WORKS - NAVIGATION FUNCTIONS
// ============================================

function navigateTo(action) {
  // Show loading/confirmation message
  let messages = {
    register: {
      title: "📝 Let's Get Started!",
      text: "Create your account to join our blood donation community.",
      url: "donor-register.html",
    },
    donate: {
      title: "🩸 Become a Hero!",
      text: "Register as a blood donor and save up to 3 lives with each donation.",
      url: "donor-register.html",
    },
    search: {
      title: "🔍 Find Donors",
      text: "Search for blood donors by blood group and location.",
      url: "search-donors.html",
    },
    request: {
      title: "💉 Request Blood",
      text: "Request blood for patients in need. We'll help you find donors.",
      url: "request-blood.html",
    },
  };

  const data = messages[action];
  if (!data) return;

  // Show confirmation before redirect
  showActionConfirmation(data.title, data.text, data.url);
}

function showActionConfirmation(title, text, url) {
  // Check if we have a modal container
  let modal = document.getElementById("actionModal");

  // If not, create one
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "actionModal";
    modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.6);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
        `;
    document.body.appendChild(modal);

    // Add fadeIn animation
    const style = document.createElement("style");
    style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes scaleIn {
                from { transform: scale(0.8); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
        `;
    document.head.appendChild(style);
  }

  // Create modal content
  modal.innerHTML = `
        <div style="
            background: white;
            padding: 2.5rem;
            border-radius: 15px;
            max-width: 450px;
            width: 90%;
            text-align: center;
            animation: scaleIn 0.3s ease;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        ">
            <div style="font-size: 3rem; margin-bottom: 1rem;">${title.split(" ")[0]}</div>
            <h2 style="color: #335c67; margin-bottom: 0.5rem;">${title}</h2>
            <p style="color: #666; margin-bottom: 1.5rem; line-height: 1.6;">${text}</p>
            <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                <button onclick="confirmNavigation('${url}')" style="
                    background: #e76f51;
                    color: white;
                    border: none;
                    padding: 0.8rem 2rem;
                    border-radius: 50px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    ✅ Continue
                </button>
                <button onclick="closeActionModal()" style="
                    background: #f0f0f0;
                    color: #333;
                    border: none;
                    padding: 0.8rem 2rem;
                    border-radius: 50px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                " onmouseover="this.style.background='#e0e0e0'" onmouseout="this.style.background='#f0f0f0'">
                    ❌ Cancel
                </button>
            </div>
        </div>
    `;

  modal.style.display = "flex";
}

function confirmNavigation(url) {
  closeActionModal();
  // Show loading message before redirect
  showConfirmationMessage("⏳ Redirecting... Please wait.", "info");
  setTimeout(() => {
    window.location.href = url;
  }, 500);
}

function closeActionModal() {
  const modal = document.getElementById("actionModal");
  if (modal) {
    modal.style.display = "none";
  }
}

// Close modal when clicking outside
document.addEventListener("click", function (event) {
  const modal = document.getElementById("actionModal");
  if (event.target === modal) {
    closeActionModal();
  }
});

// ============================================
// KEYBOARD SHORTCUT - Escape to close modal
// ============================================

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeActionModal();
  }
});
// ============================================
// BLOOD GROUP DETAILS - SHOW DONORS & STOCK
// ============================================

function showBloodGroupDetails(bloodGroup) {
  const donors = getDonors();
  const stock = getBloodStock();

  // Filter donors by blood group (only approved donors)
  const groupDonors = donors.filter(
    (d) =>
      d.bloodGroup === bloodGroup &&
      d.status === "approved" &&
      d.isAvailable === true,
  );

  // Get stock info
  const stockUnits = stock[bloodGroup] || 0;

  // Count total requests for this blood group
  const requests = getRequests();
  const groupRequests = requests.filter(
    (r) => r.bloodGroup === bloodGroup && r.status === "Pending",
  );

  // Create the details HTML
  const container = document.getElementById("bloodGroupDetails");

  // Get color class for the blood group
  const colorClass = bloodGroup.replace("+", "").replace("-", "");

  container.innerHTML = `
        <div style="
            background: white;
            border-radius: 15px;
            padding: 2rem;
            box-shadow: 0 5px 30px rgba(0,0,0,0.1);
            animation: slideUp 0.5s ease;
        ">
            <!-- Header -->
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5rem;
                padding-bottom: 1rem;
                border-bottom: 2px solid #f0f0f0;
            ">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <span class="blood-badge ${colorClass}" style="font-size: 1.5rem; padding: 0.5rem 1.2rem;">
                        ${bloodGroup}
                    </span>
                    <div>
                        <h3 style="color: #335c67; margin: 0;">Blood Group Details</h3>
                        <p style="color: #666; margin: 0; font-size: 0.9rem;">
                            ${groupDonors.length} donors available • ${stockUnits} units in stock
                        </p>
                    </div>
                </div>
                <button onclick="closeBloodGroupDetails()" style="
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #999;
                    transition: color 0.3s;
                " onmouseover="this.style.color='#e76f51'" onmouseout="this.style.color='#999'">
                    ✕
                </button>
            </div>

            <!-- Stats Row -->
            <div style="
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 1rem;
                margin-bottom: 1.5rem;
            ">
                <div style="
                    background: #f8f9fa;
                    padding: 1rem;
                    border-radius: 10px;
                    text-align: center;
                ">
                    <div style="font-size: 2rem; font-weight: bold; color: #2a9d8f;">${groupDonors.length}</div>
                    <div style="color: #666; font-size: 0.9rem;">Available Donors</div>
                </div>
                <div style="
                    background: #f8f9fa;
                    padding: 1rem;
                    border-radius: 10px;
                    text-align: center;
                ">
                    <div style="font-size: 2rem; font-weight: bold; color: #e76f51;">${stockUnits}</div>
                    <div style="color: #666; font-size: 0.9rem;">Units in Stock</div>
                </div>
                <div style="
                    background: #f8f9fa;
                    padding: 1rem;
                    border-radius: 10px;
                    text-align: center;
                ">
                    <div style="font-size: 2rem; font-weight: bold; color: #335c67;">${groupRequests.length}</div>
                    <div style="color: #666; font-size: 0.9rem;">Pending Requests</div>
                </div>
                <div style="
                    background: #f8f9fa;
                    padding: 1rem;
                    border-radius: 10px;
                    text-align: center;
                ">
                    <div style="font-size: 2rem; font-weight: bold; color: ${stockUnits > 10 ? "#2a9d8f" : stockUnits > 5 ? "#f39c12" : "#e76f51"};">
                        ${stockUnits > 10 ? "✅ Good" : stockUnits > 5 ? "⚠️ Low" : "🔴 Critical"}
                    </div>
                    <div style="color: #666; font-size: 0.9rem;">Stock Status</div>
                </div>
            </div>

            <!-- Donors List -->
            <div style="margin-top: 1.5rem;">
                <h4 style="color: #335c67; margin-bottom: 1rem;">
                    👥 Available Donors (${groupDonors.length})
                </h4>
                ${
                  groupDonors.length > 0
                    ? `
                    <div style="
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                        gap: 1rem;
                    ">
                        ${groupDonors
                          .slice(0, 10)
                          .map(
                            (donor) => `
                            <div style="
                                background: #f8f9fa;
                                padding: 1rem;
                                border-radius: 8px;
                                border-left: 3px solid #2a9d8f;
                            ">
                                <div style="font-weight: 600; color: #335c67;">${donor.fullName}</div>
                                <div style="font-size: 0.9rem; color: #666;">📍 ${donor.city || "N/A"}</div>
                                <div style="font-size: 0.9rem; color: #666;">📞 ${donor.phone || "N/A"}</div>
                                ${donor.lastDonation ? `<div style="font-size: 0.8rem; color: #999;">Last: ${formatDate(donor.lastDonation)}</div>` : ""}
                            </div>
                        `,
                          )
                          .join("")}
                        ${
                          groupDonors.length > 10
                            ? `
                            <div style="
                                background: #f0f0f0;
                                padding: 1rem;
                                border-radius: 8px;
                                text-align: center;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                color: #666;
                            ">
                                +${groupDonors.length - 10} more donors
                            </div>
                        `
                            : ""
                        }
                    </div>
                `
                    : `
                    <div style="
                        background: #fff3cd;
                        padding: 1rem;
                        border-radius: 8px;
                        text-align: center;
                        color: #856404;
                    ">
                        😔 No donors available for ${bloodGroup} right now.
                        <br><small>Check back later or try another blood group.</small>
                    </div>
                `
                }
            </div>

            <!-- Action Buttons -->
            <div style="
                margin-top: 1.5rem;
                padding-top: 1.5rem;
                border-top: 2px solid #f0f0f0;
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
            ">
                <a href="search-donors.html?blood=${bloodGroup}" style="
                    background: #2a9d8f;
                    color: white;
                    padding: 0.7rem 1.5rem;
                    border-radius: 8px;
                    text-decoration: none;
                    font-weight: 600;
                    transition: all 0.3s;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    🔍 Find ${bloodGroup} Donors
                </a>
                <a href="request-blood.html?group=${bloodGroup}" style="
                    background: #e76f51;
                    color: white;
                    padding: 0.7rem 1.5rem;
                    border-radius: 8px;
                    text-decoration: none;
                    font-weight: 600;
                    transition: all 0.3s;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    💉 Request ${bloodGroup} Blood
                </a>
                <button onclick="closeBloodGroupDetails()" style="
                    background: #f0f0f0;
                    color: #333;
                    padding: 0.7rem 1.5rem;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.3s;
                " onmouseover="this.style.background='#e0e0e0'" onmouseout="this.style.background='#f0f0f0'">
                    ✕ Close
                </button>
            </div>
        </div>
    `;

  // Show the container
  container.style.display = "block";

  // Scroll to the details
  container.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeBloodGroupDetails() {
  const container = document.getElementById("bloodGroupDetails");
  container.style.display = "none";
  container.innerHTML = "";
}

// ============================================
// URL PARAMETER HANDLING FOR BLOOD GROUP
// ============================================

// Check if URL has blood group parameter (for search page)
function getUrlParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Auto-show blood group details if URL has blood parameter
document.addEventListener("DOMContentLoaded", function () {
  const bloodParam = getUrlParam("blood");
  if (bloodParam) {
    setTimeout(() => {
      showBloodGroupDetails(bloodParam);
    }, 500);
  }
});
