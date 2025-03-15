const Voter = require("../models/Voter");

// Verify Voter ID & Eligibility
const verifyVoter = async (req, res) => {
    try {
        const { nationalId } = req.body;

        if (!nationalId) {
            return res.status(400).json({ success: false, message: "National ID is required" });
        }

        const voter = await Voter.findOne({ nationalId });

        if (!voter) {
            return res.status(404).json({ success: false, message: "Voter not found" });
        }

        if (voter.age < 18) {
            return res.status(400).json({ success: false, message: "Voter is not eligible (must be 18+)" });
        }

        if (voter.verified) {
            return res.status(200).json({ success: true, message: "Voter is already verified!", voter });
        }

        // Mark voter as verified
        voter.verified = true;
        voter.status = "Verified";
        await voter.save();

        res.status(200).json({ success: true, message: "Voter verified successfully!", voter });
    } catch (error) {
        console.error("Error verifying voter:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Approve or Reject Voter Registration
const approveRejectVoter = async (req, res) => {
    try {
        const { voterId, status } = req.body;

        console.log("🔍 Received Request:", voterId, status);

        if (!voterId || !["Verified", "Rejected"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid voter ID or status" });
        }

        const voter = await Voter.findById(voterId);
        if (!voter) {
            return res.status(404).json({ success: false, message: "Voter not found" });
        }

        voter.status = status;
        voter.verified = status === "Verified";
        await voter.save();

        console.log(`✅ Voter ${status.toLowerCase()} successfully`);
        res.status(200).json({ success: true, message: `Voter ${status.toLowerCase()} successfully`, voter });
    } catch (error) {
        console.error("❌ Error updating voter status:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};




// Get All Pending Voters (For Admin)
const getPendingVoters = async (req, res) => {
    try {
        const pendingVoters = await Voter.find({ status: "Pending" }) 
            .select("name email nationalId");  // ✅ Ensure `nationalId` is included

        res.json(pendingVoters);
    } catch (error) {
        console.error("❌ Error fetching pending voters:", error);
        res.status(500).json({ error: error.message });
    }
};


// Detect Duplicate Voters
const detectDuplicateVoters = async (req, res) => {
    try {
        const duplicates = await Voter.aggregate([
            { $group: { _id: "$nationalId", count: { $sum: 1 }, voters: { $push: "$$ROOT" } } },
            { $match: { count: { $gt: 1 } } }
        ]);

        // ✅ Ensure all entries have an `_id`
        const formattedDuplicates = duplicates.map(d => ({
            _id: d.voters[0]._id || "unknown", // Fallback ID
            nationalId: d._id,
            name: d.voters[0].name || "Unknown",
            status: d.voters[0].status || "Unknown"
        }));

        res.json(formattedDuplicates);
    } catch (error) {
        console.error("Error detecting duplicates:", error);
        res.status(500).json({ message: "Server error" });
    }
};


const getDuplicateVoters = async (req, res) => {
    try {
        const duplicates = await Voter.aggregate([
            { $group: { _id: "$nationalId", count: { $sum: 1 }, voters: { $push: "$$ROOT" } } },
            { $match: { count: { $gt: 1 } } }
        ]);

        res.json(duplicates.map(d => ({
            _id: d.voters[0]._id,
            nationalId: d._id,
            name: d.voters[0].name,
            status: d.voters[0].status
        })));
    } catch (error) {
        console.error("Error detecting duplicates:", error);
        res.status(500).json({ message: "Server error" });
    }
};




const deleteVoter = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: "Voter ID is required" });
        }

        const deletedVoter = await Voter.findByIdAndDelete(id);
        if (!deletedVoter) {
            return res.status(404).json({ success: false, message: "Voter not found" });
        }

        res.json({ success: true, message: "Voter deleted successfully!" });
    } catch (error) {
        console.error("❌ Error deleting voter:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};




// ✅ Approve Voter
const approveVoter = async (req, res) => {
    try {
        const { id } = req.params;
        const voter = await Voter.findByIdAndUpdate(id, { status: "Verified" }, { new: true });

        if (!voter) return res.status(404).json({ message: "Voter not found" });

        res.json({ message: "Voter approved successfully", voter });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ✅ Reject Voter
const rejectVoter = async (req, res) => {
    try {
        const { id } = req.params;
        const voter = await Voter.findByIdAndUpdate(id, { status: "Rejected" }, { new: true });

        if (!voter) return res.status(404).json({ message: "Voter not found" });

        res.json({ message: "Voter rejected successfully", voter });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { 
    verifyVoter, 
    getPendingVoters, 
    detectDuplicateVoters, 
    deleteVoter, 
    approveVoter,  // ✅ Ensure these are exported
    rejectVoter 
};

