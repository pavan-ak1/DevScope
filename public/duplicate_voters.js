/** ✅ Retrieve Authentication Token */
function getAuthToken() {
    return localStorage.getItem("token") || "";
}

/** ✅ Ensure User is Logged In */
function checkAuthToken() {
    const token = getAuthToken();
    if (!token) {
        console.warn("🚨 No token found! Redirecting to login...");
        window.location.href = "login.html";
    }
}

/** ✅ Fetch and Display Duplicate Voters */
async function fetchDuplicateVoters() {
    try {
        checkAuthToken(); // Ensure user is authenticated
        const token = getAuthToken();

        const response = await fetch("http://localhost:5000/api/v1/voters/duplicates", {
            headers: { 
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (response.status === 401) return handleUnauthorized();
        
        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("Invalid response format: Expected an array");
        }

        displayCandidates(data);
    } catch (error) {
        console.error("❌ Error fetching duplicate voters:", error);
        const tableBody = document.getElementById("duplicate-voters-table-body");
        if (tableBody) {
            tableBody.innerHTML = "<tr><td colspan='4' class='text-center text-danger'>Error loading duplicate voters</td></tr>";
        }
    }
}

/** ✅ Display Candidates in Table */
function displayCandidates(voters) {
    const tableBody = document.getElementById("duplicate-voters-table-body");
    if (!tableBody) {
        console.error("❌ Table body not found!");
        return;
    }

    tableBody.innerHTML = ""; // Clear previous entries

    if (voters.length === 0) {
        tableBody.innerHTML = "<tr><td colspan='4' class='text-center'>No duplicate voters found.</td></tr>";
        return;
    }

    voters.forEach(voter => {

        if (!voter._id || voter._id === "unknown") {
            console.error("❌ Invalid voter _id:", voter);
            return; // Skip rendering this row if ID is missing
        }

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${voter.nationalId || "N/A"}</td>
            <td>${voter.name || "Unknown"}</td>
            <td>${voter.status || "N/A"}</td>
            <td>
                <button onclick="deleteDuplicateVoter('${voter._id}')">Delete</button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}


/** ✅ Delete a Duplicate Voter */
async function deleteDuplicateVoter(voterId) {
    if (!voterId || voterId === "undefined") {
        console.error("❌ Invalid voterId received:", voterId);
        alert("Error: Invalid voter ID. Please try again.");
        return;
    }

    if (!confirm("Are you sure you want to delete this voter?")) return;

    try {
        const token = getAuthToken();
        if (!token) {
            window.location.href = "login.html";
            return;
        }


        const response = await fetch(`http://localhost:5000/api/v1/voters/${voterId}`, {
            method: 'DELETE',
            headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const responseData = await response.json(); // Parse the response as JSON

        if (response.ok) {
            alert("Voter deleted successfully.");
            fetchDuplicateVoters(); // Refresh the list after deletion
        } else {
            alert(`Failed to delete voter: ${responseData.message || "Unknown error"}`);
        }
    } catch (error) {
        console.error("Error deleting voter:", error);
        alert("Error deleting voter. Please try again.");
    }
}

/** ✅ Handle Unauthorized Access */
function handleUnauthorized() {
    console.warn("🚨 Unauthorized! Redirecting to login...");
    localStorage.removeItem("token");
    window.location.href = "login.html";
}

/** ✅ Load Data on Page Load */
document.addEventListener("DOMContentLoaded", function () {
    fetchDuplicateVoters();
});
