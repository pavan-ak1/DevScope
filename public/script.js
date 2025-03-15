const API_BASE_URL = window.location.hostname === "localhost" ? "http://localhost:5000" : "https://your-backend-url.com";

// ✅ Run on Page Load
document.addEventListener("DOMContentLoaded", function () {
    checkAuthToken();
    
    // Load Elections if on Dashboard
    if (document.getElementById("elections-table-body")) {
        fetchElections();
    }

    // Load Election Details if on Edit Page
    const urlParams = new URLSearchParams(window.location.search);
    const electionId = urlParams.get("electionId");
    if (electionId && document.getElementById("edit-election-form")) {
        loadElectionDetails(electionId);
        document.getElementById("edit-election-form").addEventListener("submit", function (event) {
            event.preventDefault();
            updateElection(electionId);
        });
    }
});
// ✅ Safe way to update text content in the dashboard
function setText(id, text) {
    const element = document.getElementById(id);
    if (element) {
        element.innerText = text;
    } else {
        console.warn(`⚠️ Element with ID "${id}" not found.`);
    }
}


// ✅ Check if Token Exists, Otherwise Redirect to Login
function checkAuthToken() {
    const token = getAuthToken();
    if (!token) {
        const currentPage = window.location.pathname;
        if (!currentPage.includes("login")) {
            redirectToLogin();
        }
    }
}

// ✅ Fetch Authentication Token
function getAuthToken() {
    return localStorage.getItem("token");
}

// ✅ Redirect User to Login if Unauthorized
function redirectToLogin() {
    localStorage.removeItem("token");
    window.location.href = "/election-commission-login.html";
}

// ✅ Fetch Elections for Dashboard
async function fetchElections() {
    const token = getAuthToken();
    if (!token) return redirectToLogin();

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/elections`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` },
            credentials: "include"
        });

        if (!response.ok) throw new Error("Failed to fetch elections");

        const elections = await response.json();
        updateElectionTable(elections);
    } catch (error) {
        console.error("Error fetching elections:", error);
    }
}

// ✅ Update Election Table
function updateElectionTable(elections) {
    const electionsTable = document.getElementById("elections-table-body");
    if (!electionsTable) return;

    electionsTable.innerHTML = elections.length === 0 ? `
        <tr><td colspan="4" class="text-center">No elections found</td></tr>
    ` : elections.map(election => `
        <tr>
            <td>${election.title}</td>
            <td>${new Date(election.startDate).toLocaleDateString()}</td>
            <td>${new Date(election.endDate).toLocaleDateString()}</td>
            <td>
                <button onclick="editElection('${election._id}')">Edit</button>
                <button onclick="deleteElection('${election._id}')">Delete</button>
            </td>
        </tr>
    `).join("");
}

// ✅ Redirect to Edit Page with Election ID
function editElection(electionId) {
    window.location.href = `edit-election.html?electionId=${electionId}`;
}

// ✅ Load Election Details into the Form for Editing
async function loadElectionDetails(electionId) {
    const token = getAuthToken();
    if (!token) return redirectToLogin();

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/elections/${electionId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Failed to fetch election details");

        const election = await response.json();
        document.getElementById("election-title").value = election.title;
        document.getElementById("election-start").value = election.startDate.split("T")[0];
        document.getElementById("election-end").value = election.endDate.split("T")[0];

    } catch (error) {
        console.error("Error loading election details:", error);
        alert("Failed to load election details.");
    }
}

// ✅ Update Election in Database
async function updateElection(electionId) {
    const token = getAuthToken();
    if (!token) return redirectToLogin();

    const title = document.getElementById("election-title").value;
    const startDate = document.getElementById("election-start").value;
    const endDate = document.getElementById("election-end").value;

    const updatedElection = { title, startDate, endDate };

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/elections/${electionId}`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedElection)
        });

        if (!response.ok) throw new Error("Failed to update election");

        alert("Election updated successfully!");
        window.location.href = "election-dashboard.html";

    } catch (error) {
        console.error("Error updating election:", error);
        alert("Error updating election. Please try again.");
    }
}

// ✅ Delete Election
async function deleteElection(electionId) {
    const token = getAuthToken();
    if (!token) return redirectToLogin();

    if (!confirm("Are you sure you want to delete this election?")) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/elections/${electionId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            credentials: "include"
        });

        if (!response.ok) throw new Error("Failed to delete election");

        alert("Election deleted successfully!");
        fetchElections();

    } catch (error) {
        console.error("Error deleting election:", error);
        alert("Error deleting election. Please try again.");
    }
}

async function fetchDashboardStats() {
    const token = getAuthToken();
    if (!token) return redirectToLogin();

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/elections/stats`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
            credentials: "include",
        });

        if (!response.ok) throw new Error("Unauthorized access");

        const stats = await response.json();

        setText("totalElections", stats.totalElections || "0");
        setText("totalVotes", stats.totalVotes || "0");
        setText("voterTurnout", `${stats.voterTurnout || "0"}%`);

    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
    }
}
async function fetchDashboardStats() {
    const token = localStorage.getItem("token");
    if (!token) return redirectToLogin();

    try {
        const response = await fetch("http://localhost:5000/api/v1/elections/stats", {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` },
            credentials: "include",
        });


        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const stats = await response.json();

        setText("totalElections", stats.totalElections || "0");
        setText("totalVotes", stats.totalVotes || "0");
        setText("voterTurnout", `${stats.voterTurnout || "0"}%`);
    } catch (error) {
        console.error("❌ Error fetching dashboard stats:", error);
    }
}

// ✅ Run on Page Load
document.addEventListener("DOMContentLoaded", function () {
    checkAuthToken();
    fetchDashboardStats(); // ✅ Ensure this runs
    fetchElections();
});
