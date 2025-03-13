async function fetchElections() {
    try {
        const response = await fetch("http://localhost:5000/api/v1/elections/");
        const elections = await response.json();

        const tableBody = document.getElementById("elections-table-body");
        tableBody.innerHTML = "";

        // Check if the response is an array
        if (!Array.isArray(elections)) {
            throw new Error("Invalid data format"); // Throw an error if the format is incorrect
        }

        elections.forEach(election => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${election.title}</td>
                <td>${new Date(election.startDate).toLocaleDateString()}</td>
                <td>${new Date(election.endDate).toLocaleDateString()}</td>
                <td>
                    <button onclick="viewElection('${election._id}')">View</button>
                    <button onclick="editElection('${election._id}')">Edit</button>
                    <button onclick="deleteElection('${election._id}')">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error fetching elections:", error);
    }
} 