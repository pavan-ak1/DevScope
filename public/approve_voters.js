document.addEventListener("DOMContentLoaded", fetchPendingVoters);

async function fetchPendingVoters() {  // 🔹 Removed (voters) parameter
    try {
        const response = await fetch("/api/v1/voters/pending");  
        if (!response.ok) throw new Error("Failed to fetch voters");

        const voters = await response.json();  // ✅ Fixing duplicate variable issue

        const tableBody = document.getElementById("voter-list");
        tableBody.innerHTML = "";

        voters.forEach(voter => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${voter.name}</td>
                <td>${voter.email}</td>
                <td>${voter.nationalId ? voter.nationalId : "N/A"}</td>  <!-- ✅ Fix for undefined -->
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

async function approveVoter(voterId) {
    try {
        console.log(`✅ Approving voter: ${voterId}`);
        const response = await fetch(`${API_BASE_URL}/api/v1/voters/approve-reject`, {  // ✅ FIXED URL
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({ voterId, status: "Verified" }) // ✅ FIXED REQUEST BODY
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
        const response = await fetch(`${API_BASE_URL}/api/v1/voters/approve-reject`, {  // ✅ FIXED URL
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({ voterId, status: "Rejected" }) // ✅ FIXED REQUEST BODY
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
}async function approveVoter(voterId) {
    try {
        console.log(`✅ Approving voter: ${voterId}`);
        const response = await fetch(`/api/v1/voters/approve/${voterId}`, {  // ✅ FIXED API URL
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getAuthToken()}`
            }
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
        const response = await fetch(`/api/v1/voters/reject/${voterId}`, {  // ✅ FIXED API URL
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getAuthToken()}`
            }
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




