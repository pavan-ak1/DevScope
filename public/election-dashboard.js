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
        if (!electionId) return console.warn("⚠️ No election ID provided for live vote count!");

        // ✅ Ensure the vote-count element exists before updating it
        const tableBody = document.getElementById("vote-count");
        if (!tableBody) {
            console.error("❌ Error: 'vote-count' element not found! Ensure it exists in HTML.");
            return;
        }

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


// ✅ Ensure vote count table exists before updating
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
            <td>${vote.candidateName || "Unknown Candidate"}</td>
            <td>${vote.party || "Unknown Party"}</td>
            <td>${vote.voteCount}</td>
        `;
        tableBody.appendChild(row);
    });
}

// ✅ WebSocket for real-time voting updates
const socket = new WebSocket("ws://localhost:5000"); // ✅ Connect to WebSocket Server

socket.onmessage = (event) => {
    const liveVotes = JSON.parse(event.data);
    console.log("📡 Real-Time Vote Update:", liveVotes);
    updateLiveVotingUI(liveVotes);
}
