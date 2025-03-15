const Election = require("../models/Election");
const Vote = require("../models/Vote");
const Voter = require("../models/Voter"); // ✅ Make sure this is added

// ✅ Create Election
const createElection = async (req, res) => {
  try {
    const {
      title,
      description = "",
      startDate,
      endDate,
      candidates = [],
    } = req.body; // ✅ Set default values

    if (!title || !startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Title, Start Date, and End Date are required." });
    }

    const newElection = new Election({
      title,
      description,
      startDate,
      endDate,
      candidates,
    });
    await newElection.save();

    res
      .status(201)
      .json({
        message: "Election created successfully!",
        election: newElection,
      });
  } catch (error) {
    console.error("Error creating election:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const getElections = async (req, res) => {
  try {
    const elections = await Election.find();

    // Convert ObjectId to String
    const formattedElections = elections.map((election) => ({
      ...election.toObject(), // Convert to plain JS object
      _id: election._id.toString(), // Convert ObjectId to string
    }));

    res.json(formattedElections); // Send fixed data to frontend
  } catch (error) {
    console.error("Error fetching elections:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Update Election
const updateElection = async (req, res) => {
  try {
    const { title, startDate, endDate } = req.body; // Get updated data from request body
    const electionId = req.params.id; // Get election ID from URL

    const updatedElection = await Election.findByIdAndUpdate(
      electionId, // Find election by ID
      { title, startDate, endDate }, // New data to update
      { new: true } // Return the updated document
    );

    if (!updatedElection) {
      return res.status(404).json({ message: "Election not found" });
    }

    res
      .status(200)
      .json({ message: "Election updated successfully", updatedElection });
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

const getElectionStats = async (req, res) => {
  try {
    const totalElections = await Election.countDocuments();
    const totalVotes = await Vote.countDocuments();
    const totalVoters = await Voter.countDocuments(); // Make sure ALL voters are counted

    // ✅ Ensure division by zero is handled correctly
    const voterTurnout =
      totalVoters > 0 ? ((totalVotes / totalVoters) * 100).toFixed(2) : "0.00";

    res.json({
      totalElections,
      totalVotes,
      totalVoters,
      voterTurnout,
    });
  } catch (error) {
    console.error("❌ Error fetching election stats:", error);
    res.status(500).json({ message: "Error fetching election stats" });
  }
};

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

module.exports = {
  deleteElection,
  updateElection,
  getElections,
  createElection,
  getElectionStats,
  getElectionById,
};
