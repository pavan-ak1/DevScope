document.addEventListener("DOMContentLoaded", fetchPendingVoters);

async function fetchPendingVoters() {
    try {
        const response = await fetch("/api/v1/voters/pending");
        const voters = await response.json();

        const tableBody = document.getElementById("voter-list");
        tableBody.innerHTML = "";

        voters.forEach(voter => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${voter.name}</td>
                <td>${voter.email}</td>
                <td>${voter.nationalID}</td>
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

async function approveVoter(id) {
    try {
        await fetch(`/api/v1/voters/approve/${id}`, { method: "PUT" });
        fetchPendingVoters();
    } catch (error) {
        console.error("Error approving voter:", error);
    }
}

async function rejectVoter(id) {
    try {
        await fetch(`/api/v1/voters/reject/${id}`, { method: "PUT" });
        fetchPendingVoters();
    } catch (error) {
        console.error("Error rejecting voter:", error);
    }
}
