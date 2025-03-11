document.addEventListener("DOMContentLoaded", () => {
    const partyForm = document.getElementById("party-form");
    const partyTableBody = document.getElementById("party-table-body");

    // Function to Fetch Parties from Backend
    async function fetchParties() {
        const response = await fetch("http://localhost:5000/api/v1/parties");
        const data = await response.json();

        partyTableBody.innerHTML = ""; // Clear Table
        data.forEach(party => {
            const row = `
                <tr>
                    <td><img src="${party.logo}" class="party-logo"></td>
                    <td>${party.name}</td>
                    <td>${party.symbol}</td>
                    <td>
                        <button onclick="editParty('${party._id}')">Edit</button>
                        <button onclick="deleteParty('${party._id}')">Delete</button>
                    </td>
                </tr>
            `;
            partyTableBody.innerHTML += row;
        });
    }

    // Function to Handle Party Registration
    partyForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const partyData = {
            name: document.getElementById("party-name").value,
            logo: document.getElementById("party-logo").value,
            symbol: document.getElementById("party-symbol").value,
        };

        await fetch("http://localhost:5000/api/v1/parties", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(partyData),
        });

        partyForm.reset();
        fetchParties();
    });

    // Function to Delete Party
    async function deleteParty(id) {
        await fetch(`http://localhost:5000/api/v1/parties/${id}`, { method: "DELETE" });
        fetchParties();
    }

    // Function to Edit Party
    async function editParty(id) {
        const newName = prompt("Enter new party name:");
        const newSymbol = prompt("Enter new party symbol:");
        const newLogo = prompt("Enter new logo URL:");

        if (newName && newSymbol && newLogo) {
            await fetch(`http://localhost:5000/api/v1/parties/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName, symbol: newSymbol, logo: newLogo }),
            });
            fetchParties();
        }
    }

    fetchParties(); // Load Data on Page Load
});
