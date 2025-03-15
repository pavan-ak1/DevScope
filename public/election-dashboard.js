// ✅ Safe way to update text content in the dashboard
function setText(id, text) {
    const element = document.getElementById(id);
    if (element) {
        element.innerText = text;
    } else {
        console.warn(`⚠️ Element with ID "${id}" not found.`);
    }
}

async function fetchElections() {
    const token = localStorage.getItem("token");  // Get token from localStorage
    if (!token) {
        console.error("No authentication token found. Redirecting to login.");
        return window.location.href = "/election-commission-login.html";  // Redirect to login
    }

    try {
        const response = await fetch("http://localhost:5000/api/v1/elections", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            credentials: "include"
        });


        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const elections = await response.json();

        if (!Array.isArray(elections)) {
            throw new Error("Invalid data format");
        }

        updateElectionTable(elections);
    } catch (error) {
        console.error("Error fetching elections:", error);
        displayErrorInTable("elections-table-body", "Error loading elections. Please try again.");
    }
}
async function deleteElection(electionId) {
    const token = localStorage.getItem("token");  // Get stored token
    if (!token) {
        console.error("No authentication token found. Redirecting to login.");
        return window.location.href = "/election-commission-login.html";
    }

    if (!confirm("Are you sure you want to delete this election?")) return;

    try {
        const response = await fetch(`http://localhost:5000/api/v1/elections/${electionId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`,  // ✅ Include authentication
                "Content-Type": "application/json"
            },
            credentials: "include"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to delete election.");
        }

        alert("Election deleted successfully!");
        fetchElections();  // ✅ Refresh elections list

    } catch (error) {
        console.error("Error deleting election:", error);
        alert("Error deleting election. Please try again.");
    }
}
async function editElection(electionId) {
    const token = localStorage.getItem("token");  // ✅ Get stored token
    if (!token) {
        console.error("No authentication token found. Redirecting to login.");
        return window.location.href = "/election-commission-login.html";
    }

    // ✅ Prompt user for new details
    const newTitle = prompt("Enter new election title:");
    const newStartDate = prompt("Enter new start date (YYYY-MM-DD):");
    const newEndDate = prompt("Enter new end date (YYYY-MM-DD):");

    if (!newTitle || !newStartDate || !newEndDate) {
        alert("All fields are required!");
        return;
    }

    const updatedElection = { title: newTitle, startDate: newStartDate, endDate: newEndDate };

    try {
        const response = await fetch(`http://localhost:5000/api/v1/elections/${electionId}`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,  // ✅ Include authentication
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedElection),
            credentials: "include"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to update election.");
        }

        alert("Election updated successfully!");
        fetchElections();  // ✅ Refresh election list

    } catch (error) {
        console.error("Error updating election:", error);
        alert("Error updating election. Please try again.");
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
document.addEventListener("click", async (event) => {
    if (event.target.classList.contains("approve-btn")) {
        const voterId = event.target.dataset.voterId;
        await approveVoter(voterId);
    } else if (event.target.classList.contains("reject-btn")) {
        const voterId = event.target.dataset.voterId;
        await rejectVoter(voterId);
    }
});

async function approveVoter(voterId) {
    try {
        console.log(`✅ Approving voter: ${voterId}`);
        const response = await fetch(`${API_BASE_URL}/api/v1/voters/approve-reject`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({ voterId, status: "Verified" }) // ✅ Correct API request
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
        }

        console.log("✅ Voter approved successfully!");
        fetchPendingVoters(); // Refresh the list
    } catch (error) {
        console.error("❌ Error approving voter:", error);
    }
}

async function rejectVoter(voterId) {
    try {
        console.log(`❌ Rejecting voter: ${voterId}`);
        const response = await fetch(`${API_BASE_URL}/api/v1/voters/approve-reject`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({ voterId, status: "Rejected" }) // ✅ Correct API request
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
        }

        console.log("✅ Voter rejected successfully!");
        fetchPendingVoters(); // Refresh the list
    } catch (error) {
        console.error("❌ Error rejecting voter:", error);
    }
}


async function fetchPendingVoters() {
    try {
        const response = await fetch("/api/v1/voters/pending");
        if (!response.ok) throw new Error("Failed to fetch voters");
        
        const voters = await response.json();
        displayVoters(voters);
    } catch (error) {
        console.error("Error fetching voters:", error);
        alert("Failed to load voter data.");
    }
}
