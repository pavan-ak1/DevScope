document.addEventListener("DOMContentLoaded", () => {
    const partyForm = document.getElementById("party-form");
    const partyTableBody = document.getElementById("party-table-body");

    // ✅ API Base URL (Local & Production)
    const API_BASE_URL = window.location.hostname === "localhost" ? "http://localhost:5000" : "https://your-backend-url.com";

    // ✅ Get Token from Local Storage
    function getAuthToken() {
        return localStorage.getItem("token");
    }

    // ✅ Check Authentication & Redirect If Not Logged In
    function checkAuthToken() {
        const token = getAuthToken();
        if (!token) {
            console.warn("🚨 No token found! Redirecting to login...");
            window.location.href = "/election-commission-login.html";
        }
    }

    // ✅ Fetch & Display Parties
    async function fetchParties() {
        checkAuthToken(); // Ensure User is Authenticated

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/parties`, {
                method: "GET",
                headers: { Authorization: `Bearer ${getAuthToken()}` },
                credentials: "include",
            });

            if (!response.ok) throw new Error("Failed to fetch parties");

            const data = await response.json();

            partyTableBody.innerHTML = ""; // Clear Table

            data.forEach(party => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td><img src="${party.logo}" class="party-logo" onerror="this.src='default-logo.png'"></td>
                    <td>${party.name}</td>
                    <td>${party.symbol || "N/A"}</td>
                    <td>
                        <button class="edit-btn" data-id="${party._id}">Edit</button>
                        <button class="delete-btn" data-id="${party._id}">Delete</button>
                    </td>
                `;
                partyTableBody.appendChild(row);
            });
        } catch (error) {
            console.error("❌ Error fetching parties:", error);
        }
    }

    // ✅ Add Party with Image Upload
    partyForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        checkAuthToken();

        const formData = new FormData();
        formData.append("name", document.getElementById("party-name").value);
        formData.append("symbol", document.getElementById("party-symbol").value);
        formData.append("logo", document.getElementById("party-logo").files[0]);

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/parties`, {
                method: "POST",
                headers: { Authorization: `Bearer ${getAuthToken()}` },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || "Failed to register party");

            partyForm.reset();
            fetchParties();
        } catch (error) {
            console.error("❌ Error adding party:", error);
        }
    });

    // ✅ Edit Party
    partyTableBody.addEventListener("click", async (e) => {
        if (!e.target.classList.contains("edit-btn")) return;
        checkAuthToken();

        const partyId = e.target.dataset.id;
        const newName = prompt("Enter new party name:");
        const newSymbol = prompt("Enter new party symbol:");

        if (!newName || !newSymbol) return alert("Party name and symbol are required!");

        const newLogoFile = document.createElement("input");
        newLogoFile.type = "file";
        newLogoFile.accept = "image/*";

        newLogoFile.addEventListener("change", async () => {
            const formData = new FormData();
            formData.append("name", newName);
            formData.append("symbol", newSymbol);
            if (newLogoFile.files[0]) formData.append("logo", newLogoFile.files[0]);

            try {
                const response = await fetch(`${API_BASE_URL}/api/v1/parties/${partyId}`, {
                    method: "PUT",
                    headers: { Authorization: `Bearer ${getAuthToken()}` },
                    body: formData,
                });

                if (!response.ok) throw new Error("Failed to update party");

                fetchParties();
            } catch (error) {
                console.error("❌ Error updating party:", error);
            }
        });

        newLogoFile.click();
    });

    // ✅ Delete Party
    partyTableBody.addEventListener("click", async (e) => {
        if (!e.target.classList.contains("delete-btn")) return;
        checkAuthToken();

        const partyId = e.target.dataset.id;
        if (!confirm("Are you sure you want to delete this party?")) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/parties/${partyId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${getAuthToken()}` },
                credentials: "include",
            });

            if (!response.ok) throw new Error("Failed to delete party");

            fetchParties();
        } catch (error) {
            console.error("❌ Error deleting party:", error);
        }
    });

    // ✅ Initialize
    fetchParties();
});
