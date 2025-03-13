const tableBody = document.getElementById("electionList");

// ✅ Dynamic API URL (Localhost in Dev, Deployed Backend in Production)
const API_BASE_URL = window.location.hostname === "localhost" ? "http://localhost:5000" : "https://your-backend-url.com";

// ✅ Run on Page Load
document.addEventListener("DOMContentLoaded", function () {
    checkAuthToken(); // Ensure user is logged in
    fetchDashboardStats();
    fetchElections();
    fetchVoterTurnout();
});

// ✅ Check if Token Exists, Otherwise Redirect to Login
function checkAuthToken() {
    const token = getAuthToken();

    if (!token) {
        const currentPage = window.location.pathname;

        // ✅ Redirect only if the user is not on the login page
        if (!currentPage.includes("login")) {
            redirectToLogin();
        }
    }
}

// ✅ Fetch Authentication Token
function getAuthToken() {
    return localStorage.getItem("token"); // Standardized usage
}

// ✅ Safe way to update text content
function setText(id, text) {
    const element = document.getElementById(id);
    if (element) element.innerText = text;
}

// ✅ Fetch Dashboard Stats
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

// ✅ Fetch Elections
async function fetchElections() {
    const token = getAuthToken();
    if (!token) return redirectToLogin();

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/elections`, {
            method: "GET",
            headers: { 
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            credentials: "include",
        });

        if (response.status === 401) return handleUnauthorized();
        if (!response.ok) throw new Error("Failed to fetch elections");

        const data = await response.json();

        if (!data || !Array.isArray(data.elections)) throw new Error("Invalid data format");

        updateElectionTable(data.elections);
    } catch (error) {
        console.error("Error fetching elections:", error);
        displayErrorInTable("elections-table-body", "Error loading elections. Please try again.");
    }
}

// ✅ Fetch Voter Turnout
async function fetchVoterTurnout() {
    const token = getAuthToken();
    const electionId = localStorage.getItem("currentElectionId");

    if (!token) return redirectToLogin();
    if (!electionId) return displayNoElectionSelected();

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/votes/turnout/${electionId}`, {
            headers: { Authorization: `Bearer ${token}` },
            credentials: "include",
        });

        if (!response.ok) throw new Error("Failed to fetch voter turnout");

        const data = await response.json();

        // Check if data is valid and contains the expected properties
        if (data && typeof data.totalVotes === 'number' && typeof data.turnoutPercentage === 'number') {
            setText("totalVotes", data.totalVotes.toString());
            setText("voterTurnout", `${data.turnoutPercentage}%`);
        } else {
            displayErrorInTable("voter-turnout-table", "Error loading voter turnout data. Please try again.");
        }
    } catch (error) {
        console.error("Error fetching voter turnout:", error);
        displayErrorInTable("voter-turnout-table", "Server error. Try again later.");
    }
}

// ✅ Auto-Refresh Voter Turnout Every 10 Seconds
if (window.voterTurnoutInterval) clearInterval(window.voterTurnoutInterval);
window.voterTurnoutInterval = setInterval(fetchVoterTurnout, 10000);

// ✅ Utility Functions
function redirectToLogin() {
    localStorage.removeItem("token");
    window.location.href = "/election-commission-login.html";
}

function handleUnauthorized() {
    redirectToLogin();
}

function displayNoElectionSelected() {
    setText("totalVotes", "N/A");
    setText("voterTurnout", "N/A");
}

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

function displayErrorInTable(tableId, message) {
    const table = document.getElementById(tableId);
    if (table) {
        table.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-danger">${message}</td>
            </tr>
        `;
    }
}

// ✅ Election Commission Login
async function loginElectionCommission(email, password) {
    try {
        const response = await fetch("/api/v1/election-commission/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        if (!data.success) throw new Error(data.error || "Login failed!");

        localStorage.setItem("token", data.token); 

        // ✅ Redirect to Dashboard
        window.location.href = "/election-dashboard.html";
    } catch (error) {
        console.error("Login error:", error);
        alert(error.message || "Login failed!");
    }
}

async function fetchPendingVoters() {
    const token = getAuthToken();
    if (!token) return redirectToLogin();

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/voters/pending`, {
            method: "GET",
            headers: { 
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            credentials: "include",
        });

        if (response.status === 401) return handleUnauthorized();

        const data = await response.json();
        console.log("✅ Pending Voters API Response:", data); // Debugging

        // Check if data is valid and contains the expected properties
        if (data && Array.isArray(data)) {
            updatePendingVotersTable(data);
        } else {
            console.warn("⚠️ Invalid data format received for pending voters");
            displayErrorInTable("pending-voters-table-body", "Error loading pending voters. Please try again.");
        }
    } catch (error) {
        console.error("Error fetching pending voters:", error);
        displayErrorInTable("pending-voters-table-body", "Server error. Try again later.");
    }
}
