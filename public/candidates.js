document.addEventListener("DOMContentLoaded", function () {
    checkAuthToken(); // ✅ Ensure user is authenticated
    fetchParties();
    fetchElections();
    loadDefaultElection();

    document.getElementById("candidate-form").addEventListener("submit", registerCandidate);
    document.getElementById("election-select").addEventListener("change", function () {
        fetchCandidates(this.value);
    });
});

/** ✅ Get Token from Local Storage */
function getAuthToken() {
    return localStorage.getItem("token") || "";
}

/** ✅ Ensure User is Logged In */
function checkAuthToken() {
    const token = getAuthToken();
    if (!token) redirectToLogin();
}

/** ✅ Fetch and Populate Parties */
async function fetchParties() {
    try {
        const response = await fetch("http://localhost:5000/api/v1/parties", {
            headers: { Authorization: `Bearer ${getAuthToken()}`, "Content-Type": "application/json" }
        });

        if (!response.ok) return handleUnauthorized();
        const data = await response.json();

        const partySelect = document.getElementById("party-select");
        partySelect.innerHTML = `<option value="">-- Select Party --</option>`;
        data.forEach(party => {
            partySelect.innerHTML += `<option value="${party._id}">${party.name}</option>`;
        });

    } catch (error) {
        console.error("❌ Error fetching parties:", error);
    }
}

/** ✅ Fetch and Populate Elections */
async function fetchElections() {
    try {
        const response = await fetch("http://localhost:5000/api/v1/elections", {
            headers: { Authorization: `Bearer ${getAuthToken()}`, "Content-Type": "application/json" }
        });

        if (!response.ok) return handleUnauthorized();
        const data = await response.json();
        const elections = Array.isArray(data) ? data : data.elections;

        if (!Array.isArray(elections)) throw new Error("Invalid election data format");

        const electionSelect = document.getElementById("election-select");
        electionSelect.innerHTML = `<option value="">-- Select Election --</option>`;

        if (elections.length > 0) {
            localStorage.setItem("currentElectionId", elections[0]._id);
        }

        elections.forEach(election => {
            electionSelect.innerHTML += `<option value="${election._id}">${election.title}</option>`;
        });

    } catch (error) {
        console.error("❌ Error fetching elections:", error);
    }
}

/** ✅ Register a New Candidate */
async function registerCandidate(event) {
    event.preventDefault();

    const name = document.getElementById("candidate-name").value;
    const partyId = document.getElementById("party-select").value;
    const electionId = document.getElementById("election-select").value;

    if (!name || !partyId || !electionId) {
        alert("All fields are required!");
        return;
    }

    try {
        const response = await fetch("http://localhost:5000/api/v1/candidates", {
            method: "POST",
            headers: { Authorization: `Bearer ${getAuthToken()}`, "Content-Type": "application/json" },
            body: JSON.stringify({ name, partyId, electionId }),
        });

        if (!response.ok) throw new Error("Candidate registration failed");

        alert("✅ Candidate Registered Successfully!");
        fetchCandidates(electionId);
        document.getElementById("candidate-form").reset();

    } catch (error) {
        console.error("❌ Error registering candidate:", error);
        alert("Error: " + error.message);
    }
}

/** ✅ Fetch and Display Candidates */
async function fetchCandidates(electionId) {
    if (!electionId) {
        console.warn("⚠️ No election selected.");
        return;
    }

    try {

        const response = await fetch(`http://localhost:5000/api/v1/candidates/${electionId}`, {
            headers: { Authorization: `Bearer ${getAuthToken()}` }
        });

        if (!response.ok) {
            console.error("❌ API Error:", response.statusText);
            return;
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            console.error("⚠️ API did not return an array. Received:", data);
            return;
        }

        displayCandidates(data);

    } catch (error) {
        console.error("❌ Failed to fetch candidates:", error);
    }
}




/** ✅ Display Candidates in the Table */
function displayCandidates(candidates) {
    const candidatesTable = document.getElementById("candidates-table-body");
    candidatesTable.innerHTML = ""; // ✅ Clear table before adding new data


    if (candidates.length === 0) {
        candidatesTable.innerHTML = `<tr><td colspan="4">No candidates found</td></tr>`;
        return;
    }

    candidates.forEach(candidate => {
        let row = document.createElement("tr");
        row.innerHTML = `
            <td>${candidate.name}</td>
            <td>${candidate.party?.name || "No Party"}</td>
            <td>${candidate.election?.title || "No Election"}</td>
            <td>
                <button onclick="approveCandidate('${candidate._id}')">Approve</button>
                <button onclick="rejectCandidate('${candidate._id}')">Reject</button>
                <button onclick="deleteCandidate('${candidate._id}')">Delete</button>
            </td>
        `;
        candidatesTable.appendChild(row);
    });
}

/** ✅ Load Default Election and Fetch Candidates */
async function loadDefaultElection() {
    const electionId = localStorage.getItem("currentElectionId");
    if (electionId) {
        document.getElementById("election-select").value = electionId;
        fetchCandidates(electionId);
    }
}

/** ✅ Approve Candidate */
async function approveCandidate(id) {
    try {
        const response = await fetch(`http://localhost:5000/api/v1/candidates/${id}`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${getAuthToken()}`, "Content-Type": "application/json" },
            body: JSON.stringify({ status: "approved" })
        });

        if (!response.ok) throw new Error("Approval failed");

        alert("✅ Candidate Approved!");
        fetchCandidates(document.getElementById("election-select").value);

    } catch (error) {
        console.error("❌ Error approving candidate:", error);
    }
}

/** ✅ Reject Candidate */
async function rejectCandidate(id) {
    try {
        const response = await fetch(`http://localhost:5000/api/v1/candidates/${id}`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${getAuthToken()}`, "Content-Type": "application/json" },
            body: JSON.stringify({ status: "rejected" })
        });

        if (!response.ok) throw new Error("Rejection failed");

        alert("❌ Candidate Rejected!");
        fetchCandidates(document.getElementById("election-select").value);

    } catch (error) {
        console.error("❌ Error rejecting candidate:", error);
    }
}

/** ✅ Delete Candidate */
async function deleteCandidate(id) {
    if (!confirm("Are you sure you want to delete this candidate?")) return;

    try {
        const response = await fetch(`http://localhost:5000/api/v1/candidates/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${getAuthToken()}` }
        });

        if (!response.ok) throw new Error("Deletion failed");

        alert("✅ Candidate Deleted!");
        fetchCandidates(document.getElementById("election-select").value);

    } catch (error) {
        console.error("❌ Error deleting candidate:", error);
    }
}

/** ✅ Handle Unauthorized Requests */
function handleUnauthorized() {
    console.warn("🚨 Unauthorized! Redirecting to login...");
    localStorage.removeItem("token");
    window.location.href = "login.html";
}

/** ✅ Redirect to Login If No Token */
function redirectToLogin() {
    window.location.href = "login.html";
}
