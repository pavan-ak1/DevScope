const API_BASE_URL = window.location.hostname === "localhost" 
    ? "http://localhost:5000" 
    : "https://your-production-url.com";  // Replace with actual production URL

// ✅ Fix: Define getAuthToken()
function getAuthToken() {
    return localStorage.getItem("token") || "";
}

document.addEventListener("DOMContentLoaded", async () => {
    await fetchElectionStats();
    await fetchElections();
    await fetchPendingVoters();

    // ✅ Fetch live voting count only if there are elections
    const elections = await fetchElections();
    if (elections.length > 0) {
        fetchLiveVotingCount(elections[0]._id); // ✅ Fetch live vote count for the first election
    }
});

// ✅ Fetch overall election stats
async function fetchElectionStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/elections/stats`);
        const data = await response.json();

        document.getElementById("total-elections").innerText = data.totalElections;
        document.getElementById("total-votes").innerText = data.totalVotes;
        document.getElementById("voter-turnout").innerText = `${data.voterTurnout}%`;
    } catch (error) {
        console.error("Error fetching election stats:", error);
    }
}

// ✅ Fetch all elections
async function fetchElections() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/elections`);
        const elections = await response.json();

        const tableBody = document.getElementById("election-list");
        if (!tableBody) return console.error("❌ Table body element for elections not found!");

        tableBody.innerHTML = "";

        elections.forEach(election => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${election.title}</td>
                <td>${new Date(election.startDate).toLocaleDateString()}</td>
                <td>${new Date(election.endDate).toLocaleDateString()}</td>
                <td>
                    <button onclick="editElection('${election._id}')">Edit</button>
                    <button onclick="deleteElection('${election._id}')">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        return elections; // ✅ Return the elections list
    } catch (error) {
        console.error("Error fetching elections:", error);
        return [];
    }
}

// ✅ Fetch pending voter approvals
async function fetchPendingVoters() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/voters/pending`);
        const voters = await response.json();

        const tableBody = document.getElementById("voter-list");
        if (!tableBody) return console.error("❌ Table body element for voters not found!");

        tableBody.innerHTML = "";

        voters.forEach(voter => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${voter.name}</td>
                <td>${voter.email}</td>
                <td>${voter.nationalId || "N/A"}</td>  <!-- Fix undefined National ID -->
                <td>
                    <button onclick="approveVoter('${voter._id}')">Approve</button>
                    <button onclick="rejectVoter('${voter._id}')">Reject</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error fetching voters:", error);
    }
}

// ✅ Fetch live voting count
async function fetchLiveVotingCount(electionId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/votes/live/${electionId}`, {  
            headers: { "Authorization": `Bearer ${getAuthToken()}` } 
        });

        if (!response.ok) {
            throw new Error(`Error fetching live voting count: ${response.status}`);
        }

        const data = await response.json();
        console.log("✅ Live Vote Count Data:", data);

        updateLiveVotingUI(data);
    } catch (error) {
        console.error("❌ Error fetching live voting count:", error);
    }
}

// ✅ Update Live Vote Count UI
function updateLiveVotingUI(liveVotes) {
    const tableBody = document.getElementById("vote-count");
    if (!tableBody) {
        console.error("❌ Error: 'vote-count' element not found! Ensure it exists in HTML.");
        return;
    }

    tableBody.innerHTML = "";

    liveVotes.forEach(vote => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${vote.candidate}</td>
            <td>${vote.party}</td>
            <td>${vote.votes}</td>
        `;
        tableBody.appendChild(row);
    });
}


// ✅ WebSocket for real-time voting updates
const socket = io("http://localhost:5000"); // Ensure correct backend URL

socket.on("updateLiveVotes", (data) => {
    console.log("🔥 Live Vote Update Received:", data);
    updateVoteCountOnUI(data); // Make sure this function updates the UI
});



document.addEventListener("DOMContentLoaded", () => {
    // Ensure buttons exist before adding event listeners
    const createElectionBtn = document.getElementById("create-election-btn");
    const manageElectionsBtn = document.getElementById("manage-elections-btn");

    if (createElectionBtn) {
        createElectionBtn.addEventListener("click", () => {
            window.location.href = "create-election.html"; // ✅ Redirect to create election page
        });
    } else {
        console.error("❌ 'Create Election' button not found in HTML.");
    }

    if (manageElectionsBtn) {
        manageElectionsBtn.addEventListener("click", () => {
            window.location.href = "manage-elections.html"; // ✅ Redirect to manage elections page
        });
    } else {
        console.error("❌ 'Manage Elections' button not found in HTML.");
    }
});


function editElection(electionId) {
    window.location.href = `edit-election.html?id=${electionId}`;
}



async function deleteElection(electionId) {
    if (!confirm("Are you sure you want to delete this election?")) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/elections/${electionId}`, {
            method: "DELETE"
        });

        if (!response.ok) throw new Error("Failed to delete election");

        alert("Election deleted successfully!");
        fetchElections(); // Refresh the list
    } catch (error) {
        console.error("Error deleting election:", error);
    }
}

const sidebar = document.getElementById("sidebar");
const toggleBtn = document.getElementById("toggle-btn");
const content = document.getElementById("content"); // Main content

toggleBtn.addEventListener("click", function () {
    if (sidebar.style.left === "-250px") {
        sidebar.style.left = "0";
        document.body.classList.add("sidebar-open");
    } else {
        sidebar.style.left = "-250px";
        document.body.classList.remove("sidebar-open");
    }
});
