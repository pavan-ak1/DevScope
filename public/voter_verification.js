document.addEventListener("DOMContentLoaded", function () {
    const verifyBtn = document.getElementById("verifyBtn");
    
    verifyBtn.addEventListener("click", async function () {
        const nationalId = document.getElementById("nationalId").value.trim();

        if (!nationalId) {
            alert("Please enter a National ID.");
            return;
        }

        try {
            const response = await fetch("/api/v1/voters/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nationalId })
            });

            const data = await response.json();

            if (data.success) {
                document.getElementById("verificationResult").innerText = "Voter Verified Successfully!";
            } else {
                document.getElementById("verificationResult").innerText = `Verification Failed: ${data.message}`;
            }
        } catch (error) {
            console.error("Error verifying voter:", error);
            document.getElementById("verificationResult").innerText = "Server error. Try again later.";
        }
    });
});
