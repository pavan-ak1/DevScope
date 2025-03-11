const Election = require("../models/Election");
const Vote = require("../models/Vote");

// ✅ Create Election
const createElection = async (req, res) => {
    try {
        const { title, description, startDate, endDate, candidates } = req.body;
        const newElection = new Election({ title, description, startDate, endDate, candidates });
        await newElection.save();
        res.status(201).json({ message: "Election created successfully!", election: newElection });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ✅ Get All Elections
const getElections = async (req, res) => {
    try {
        const elections = await Election.find();
        res.status(200).json(elections);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ✅ Update Election
const updateElection = async (req, res) => {
    try {
        const { title, startDate, endDate } = req.body; // Get updated data from request body
        const electionId = req.params.id; // Get election ID from URL

        console.log("Updating election:", electionId); // Debugging log

        const updatedElection = await Election.findByIdAndUpdate(
            electionId,  // Find election by ID
            { title, startDate, endDate }, // New data to update
            { new: true } // Return the updated document
        );

        if (!updatedElection) {
            return res.status(404).json({ message: "Election not found" });
        }

        res.status(200).json({ message: "Election updated successfully", updatedElection });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// ✅ Delete Election
const deleteElection = async (req, res) => {
    try {
        await Election.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Election deleted successfully!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


async function getElectionStats(req, res) {
    try {
        const totalElections = await Election.countDocuments();
        const totalVotes = await Vote.countDocuments();
        const voterTurnout = totalElections > 0 ? (totalVotes / totalElections) * 100 : 0;

        res.json({
            totalElections,
            totalVotes,
            voterTurnout: voterTurnout.toFixed(2),
        });
    } catch (error) {
        console.error("Error fetching election stats:", error);
        res.status(500).json({ message: "Error fetching election stats" });
    }
}

const getElectionById = async (req, res) => {
    try {
        const election = await Election.findById(req.params.id);
        if (!election) {
            return res.status(404).json({ message: "Election not found" });
        }
        res.status(200).json(election);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


module.exports = {deleteElection,updateElection,getElections,createElection,getElectionStats,getElectionById}