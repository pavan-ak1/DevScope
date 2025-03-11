document.addEventListener("DOMContentLoaded", async function () {
    await loadParties();
    await loadElections();

    const form = document.getElementById("register-candidate-form");
    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const name = document.getElementById("candidate-name").value;
        const partyId = document.getElementById("party").value;
        const electionId = document.getElementById("election").value;
        const symbolFile = document.getElementById("symbol").files[0];

        if (!name || !partyId || !electionId || !symbolFile) {
            alert("Please fill all fields!");
            return;
        }

        const formData = new FormData();
        formData.append("name", name);
        formData.append("partyId", partyId);
        formData.append("electionId", electionId);
        formData.append("symbol", symbolFile);

        try {
            const response = await fetch("/api/v1/candidates", {
                method: "POST",
                body: formData
            });

            if (response.ok) {
                alert("Candidate registered successfully!");
                window.location.href = "candidates.html";
            } else {
                const errorData = await response.json();
                alert("Error: " + errorData.message);
            }
        } catch (error) {
            console.error("Error registering candidate:", error);
        }
    });
});

async function loadParties() {
    const response = await fetch("/api/v1/parties");
    const parties = await response.json();
    const partySelect = document.getElementById("party");
    
    parties.forEach(party => {
        const option = document.createElement("option");
        option.value = party._id;
        option.textContent = party.name;
        partySelect.appendChild(option);
    });
}

async function loadElections() {
    const response = await fetch("/api/v1/elections");
    const elections = await response.json();
    const electionSelect = document.getElementById("election");

    elections.forEach(election => {
        const option = document.createElement("option");
        option.value = election._id;
        option.textContent = election.title;
        electionSelect.appendChild(option);
    });
}
