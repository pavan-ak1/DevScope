const tableBody = document.getElementById("electionList");

document.addEventListener("DOMContentLoaded", function () {
    // ✅ Signup Button
    const signupBtn = document.getElementById("signup-btn");
    if (signupBtn) signupBtn.addEventListener("click", signup);

    // ✅ Login Button
    const loginBtn = document.getElementById("login-btn");
    if (loginBtn) loginBtn.addEventListener("click", login);

    // ✅ Google Login Button
    const googleBtn = document.getElementById("google-btn");
    if (googleBtn) googleBtn.addEventListener("click", googleLogin);

    // ✅ Logout Button
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) logoutBtn.addEventListener("click", logout);

    // ✅ Load Data
    fetchDashboardStats();
    fetchElections();
});

/** ✅ SIGNUP FUNCTION */
async function signup() {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!name || !email || !password) return alert("Please fill all fields!");

    try {
        const response = await fetch("/api/v1/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
        });

        const data = await response.json();
        alert(data.message);
        if (data.success) window.location.href = "login.html";
    } catch (error) {
        console.error("Signup error:", error);
        alert("Signup failed!");
    }
}

/** ✅ LOGIN FUNCTION */
async function login() {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) return alert("Please enter email and password!");

    try {
        const response = await fetch("/api/v1/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (data.success) {
            localStorage.setItem("token", data.token);
            window.location.href = "dashboard.html";
        } else {
            alert(data.error);
        }
    } catch (error) {
        console.error("Login error:", error);
        alert("Login failed!");
    }
}

/** ✅ LOGOUT FUNCTION */
function logout() {
    localStorage.removeItem("token");
    window.location.href = "login.html";
}

/** ✅ Fetch Dashboard Stats */
async function fetchDashboardStats() {
    try {
        const response = await fetch("/api/v1/elections/stats");
        const stats = await response.json();

        document.getElementById("totalElections").innerText = stats.totalElections;
        document.getElementById("totalVotes").innerText = stats.totalVotes;
        document.getElementById("voterTurnout").innerText = stats.voterTurnout + "%";
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
    }
}

/** ✅ Fetch and Display Elections */
async function fetchElections() {
    try {
        const response = await fetch("/api/v1/elections");
        const elections = await response.json();
        console.log("Fetched Elections:", elections); // Debugging

        const electionsTable = document.getElementById("elections-table-body");
        if (!electionsTable) {
            console.error("Error: Table body not found in the DOM");
            return;
        }

        electionsTable.innerHTML = ""; // Clear old data

        elections.forEach(election => {
            electionsTable.innerHTML += `
                <tr>
                    <td>${election.title}</td>
                    <td>${new Date(election.startDate).toLocaleDateString()}</td>
                    <td>${new Date(election.endDate).toLocaleDateString()}</td>
                    <td>
                        <button onclick="editElection('${election._id}', '${election.title}', '${election.startDate}', '${election.endDate}')">Edit</button>
                        <button onclick="deleteElection('${election._id}')">Delete</button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Error fetching elections:", error);
    }
}




/** ✅ Redirect Functions */
function redirectToCreateElection() {
    window.location.href = "create-election.html";
}

function redirectToManageElections() {
    window.location.href = "manage-elections.html";
}

/** ✅ Create Election Form Submission */
document.addEventListener("DOMContentLoaded", function () {
    const createElectionForm = document.getElementById("create-election-form");
    if (createElectionForm) {
        createElectionForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const title = document.getElementById("election-title").value;
            const startDate = document.getElementById("election-start").value;
            const endDate = document.getElementById("election-end").value;

            const response = await fetch("/api/v1/elections/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, startDate, endDate }),
            });

            const result = await response.json();
            if (response.ok) {
                alert("Election created successfully!");
                window.location.href = "manage-elections.html";
            } else {
                alert("Error: " + result.message);
            }
        });
    }
});


/** ✅ DELETE ELECTION */
function deleteElection(id) {
    if (!confirm("Are you sure you want to delete this election?")) return;

    fetch(`/api/v1/elections/${id}`, { method: "DELETE" })
        .then(response => response.json())
        .then(data => {
            alert("Election deleted successfully!");
            fetchElections();
        })
        .catch(error => console.error("Error deleting election:", error));
}
function editElection(id) {
    window.location.href = `edit-election.html?id=${id}`; // ✅ Redirect to new page with election ID
}


document.addEventListener("DOMContentLoaded", async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const electionId = urlParams.get("id"); // ✅ Get election ID from URL
    console.log("Election ID:", electionId);


    if (electionId) {
        try {
            const response = await fetch(`/api/v1/elections/${electionId}`);
            const election = await response.json();

            document.getElementById("election-id").value = election._id;
            document.getElementById("election-title").value = election.title;
            document.getElementById("election-start").value = election.startDate.split("T")[0];
            document.getElementById("election-end").value = election.endDate.split("T")[0];
        } catch (error) {
            console.error("Error fetching election:", error);
        }
    }
});


document.addEventListener("DOMContentLoaded", function () {
    const editElectionForm = document.getElementById("edit-election-form");

    if (editElectionForm) {
        editElectionForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const electionId = document.getElementById("election-id").value;
            const title = document.getElementById("election-title").value;
            const startDate = document.getElementById("election-start").value;
            const endDate = document.getElementById("election-end").value;

            try {
                const response = await fetch(`/api/v1/elections/${electionId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title, startDate, endDate }),
                });

                if (response.ok) {
                    alert("Election updated successfully!");
                    window.location.href = "manage-elections.html"; // ✅ Redirect back after update
                } else {
                    const result = await response.json();
                    alert("Error: " + result.message);
                }
            } catch (error) {
                console.error("Error updating election:", error);
            }
        });
    }
});
