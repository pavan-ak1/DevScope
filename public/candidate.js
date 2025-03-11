document.addEventListener("DOMContentLoaded", function () {
    fetchParties();
    fetchElections();
    fetchCandidates();

    document.getElementById("candidate-form").addEventListener("submit", registerCandidate);
});

/** ✅ Fetch and Populate Parties */
async function fetchParties() {
    const response = await fetch("/api/v1/parties");
    const parties = await response.json();

    const partySelect = document.getElementById("party-select");
    parties.forEach(party => {
        const option = document.createElement("option");
        option.value = party._id;
        option.textContent = party.name;
        partySelect.appendChild(option);
    });
}

/** ✅ Fetch and Populate Elections */
async function fetchElections() {
    const response = await fetch("/api/v1/elections");
    const elections = await response.json();

    const electionSelect = document.getElementById("election-select");
    elections.forEach(election => {
        const option = document.createElement("option");
        option.value = election._id;
        option.textContent = election.title;
        electionSelect.appendChild(option);
    });
}

/** ✅ Register a New Candidate */
async function registerCandidate(event) {
    event.preventDefault();

    const name = document.getElementById("candidate-name").value;
    const partyId = document.getElementById("party-select").value;
    const electionId = document.getElementById("election-select").value;

    const response = await fetch("/api/v1/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, partyId, electionId }),
    });

    const result = await response.json();
    if (response.ok) {
        alert("Candidate Registered!");
        fetchCandidates();
    } else {
        alert("Error: " + result.message);
    }
}

/** ✅ Fetch and Display Candidates */
function fetchCandidates() {
    fetch("http://localhost:5000/api/v1/candidates/12345") // Replace with actual electionId
        .then(res => res.json())
        .then(data => {
            const table = document.getElementById("candidatesTable");
            table.innerHTML = data.map(candidate => `
                <tr>
                    <td>${candidate.name}</td>
                    <td>${candidate.party.name}</td>
                    <td>${candidate.status}</td>
                    <td>
                        <button onclick="approveCandidate('${candidate._id}', 'approved')">Approve</button>
                        <button onclick="approveCandidate('${candidate._id}', 'rejected')">Reject</button>
                        <button onclick="deleteCandidate('${candidate._id}')">Delete</button>
                    </td>
                </tr>
            `).join("");
        });
}

/** ✅ Approve Candidate */
function approveCandidate(id, status) {
    fetch(`http://localhost:5000/api/v1/candidates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
    }).then(() => fetchCandidates());
}

/** ✅ Reject Candidate */
async function rejectCandidate(id) {
    await fetch(`/api/v1/candidates/${id}/reject`, { method: "PUT" });
    alert("Candidate Rejected!");
    fetchCandidates();
}

/** ✅ Delete Candidate */
function deleteCandidate(id) {
    fetch(`http://localhost:5000/api/v1/candidates/${id}`, {
        method: "DELETE"
    }).then(() => fetchCandidates());
}
