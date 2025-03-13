const Candidate = require("../models/Candidate");
const Party = require("../models/Party");
const Election = require("../models/Election");
const mongoose = require("mongoose"); 



// 📌 Register Candidate
exports.registerCandidate = async (req, res) => {
    try {
        const { name, partyId, electionId } = req.body;

        // Validate MongoDB ObjectIds
        if (!mongoose.Types.ObjectId.isValid(partyId) || !mongoose.Types.ObjectId.isValid(electionId)) {
            return res.status(400).json({ error: "Invalid party ID or election ID format." });
        }

        // Validate input
        if (!name || !partyId || !electionId) {
            return res.status(400).json({ error: "All fields are required." });
        }

        // Check if Party & Election exist
        console.log("Received partyId:", partyId);
console.log("Received electionId:", electionId);
        // Convert string IDs to ObjectId before querying
const party = await Party.findById(new mongoose.Types.ObjectId(partyId));
const election = await Election.findById(new mongoose.Types.ObjectId(electionId));

        
console.log("Fetched Party:", party);
console.log("Fetched Election:", election);
        
        if (!party || !election) {
            return res.status(404).json({ error: "Party or Election not found." });
        }

        const candidate = new Candidate({ name, party: partyId, election: electionId });
        await candidate.save();

        res.status(201).json({ message: "Candidate registered successfully.", candidate });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 📌 Get Candidates for an Election
exports.getCandidates = async (req, res) => {
    try {
        const { electionId } = req.params;

        console.log(`📌 Fetching candidates for Election ID: ${electionId}`);

        if (!mongoose.Types.ObjectId.isValid(electionId)) {
            return res.status(400).json({ error: "Invalid Election ID format." });
        }

        const electionExists = await Election.findById(electionId);
        if (!electionExists) {
            return res.status(404).json({ error: "Election not found." });
        }

        // ✅ Fetch ALL Candidates for the Given Election
        const candidates = await Candidate.find({ election: electionId })
            .populate("party", "name symbol")  
            .populate("election", "title");

        console.log("🔹 Found Candidates:", candidates); // ✅ Log the full list of candidates

        if (!candidates || candidates.length === 0) {
            console.warn("⚠️ No candidates found. Returning empty array.");
            return res.json([]);
        }

        res.json(candidates);

    } catch (error) {
        console.error("❌ Error fetching candidates:", error);
        res.status(500).json({ error: "Failed to fetch candidates" });
    }
};







// 📌 Approve or Reject Candidate
exports.approveCandidate = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid candidate ID format." });
        }

        if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({ error: "Invalid status." });
        }

        const candidate = await Candidate.findByIdAndUpdate(id, { status }, { new: true });
        if (!candidate) return res.status(404).json({ error: "Candidate not found." });

        res.json({ message: `Candidate ${status} successfully.`, candidate });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 📌 Delete Candidate
exports.deleteCandidate = async (req, res) => {
    try {
        const { id } = req.params;
        const candidate = await Candidate.findByIdAndDelete(id);
        if (!candidate) return res.status(404).json({ error: "Candidate not found." });

        res.json({ message: "Candidate deleted successfully." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
