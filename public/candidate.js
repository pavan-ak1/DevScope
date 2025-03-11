document.addEventListener("DOMContentLoaded", fetchCandidates);

async function fetchCandidates() {
    try {
        const response = await fetch("/api/v1/candidates");
        const candidates = await response.json();
        
        const tableBody = document.getElementById("candidate-table-body");
        tableBody.innerHTML = "";

        candidates.forEach(candidate => {
            tableBody.innerHTML += `
                <tr>
                    <td>${candidate.name}</td>
                    <td>${candidate.partyName}</td>
                    <td>${candidate.electionTitle}</td>
                    <td>${candidate.status}</td>
                    <td>
                        <button onclick="approveCandidate('${candidate._id}')">Approve</button>
                        <button onclick="rejectCandidate('${candidate._id}')">Reject</button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Error fetching candidates:", error);
    }
}

async function approveCandidate(id) {
    await updateCandidateStatus(id, "Approved");
}

async function rejectCandidate(id) {
    await updateCandidateStatus(id, "Rejected");
}

async function updateCandidateStatus(id, status) {
    try {
        await fetch(`/api/v1/candidates/${id}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status })
        });

        fetchCandidates();
    } catch (error) {
        console.error("Error updating candidate status:", error);
    }
}
