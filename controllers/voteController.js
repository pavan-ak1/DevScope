const Vote = require("../models/Vote");
const Election = require('../models/Election');
const Voter = require("../models/Voter");
const mongoose = require("mongoose");
const Candidate = require("../models/Candidate");



// Cast a vote
exports.castVote = async (req, res) => {
    try {
        const { electionId, voterId, candidateId } = req.body;
        
        if (!electionId || !voterId || !candidateId) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        // Check if voter has already voted
        const existingVote = await Vote.findOne({ voterId, electionId });

        if (existingVote) {
            return res.status(400).json({ success: false, message: "Voter has already voted" });
        }

        const vote = new Vote({ electionId, voterId, candidateId });
        await vote.save();

        // ✅ Increment Candidate votes
        await Candidate.findByIdAndUpdate(candidateId, { $inc: { votesReceived: 1 } });

        // ✅ Increment total votes in Election
        await Election.findByIdAndUpdate(electionId, { $inc: { votesCast: 1 } });

        res.status(201).json({ success: true, message: "Vote recorded successfully", vote });
    } catch (error) {
        console.error("Vote casting error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};



// Get votes for an election
exports.getVotes = async (req, res) => {
    try {
        const votes = await Vote.find().populate("electionId voterId candidateId");
        res.json({ success: true, votes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};


// Get voter turnout for an election
exports.getVoterTurnout = async (req, res) => {
    try {
        const { electionId } = req.params;
        
        // Fetch total votes and calculate turnout percentage
        const totalVotes = await Vote.countDocuments({ electionId });
        const totalVoters = await Voter.countDocuments({ election: electionId });
        const turnoutPercentage = totalVoters > 0 ? (totalVotes / totalVoters) * 100 : 0;

        res.json({
            totalVotes,
            turnoutPercentage
        });
    } catch (error) {
        console.error("Error fetching voter turnout:", error);
        res.status(500).json({ message: "Server error" });
    }
};


exports.getLiveVoteCount = async (req, res) => {
    try {
        const { electionId } = req.params;

        if (!electionId) {
            return res.status(400).json({ message: "Election ID is required" });
        }

        const voteCounts = await Candidate.aggregate([
            { $match: { election: new mongoose.Types.ObjectId(electionId) } }, // ✅ Get all candidates in the election
            {
                $lookup: { 
                    from: "votes",
                    localField: "_id",
                    foreignField: "candidateId",
                    as: "voteData"
                }
            },
            {
                $lookup: { 
                    from: "parties",
                    localField: "party",
                    foreignField: "_id",
                    as: "partyData"
                }
            },
            { $unwind: { path: "$partyData", preserveNullAndEmptyArrays: true } }, // ✅ Preserve missing party info
            {
                $project: { 
                    candidate: "$name",
                    party: "$partyData.name",
                    votes: { $ifNull: [{ $size: "$voteData" }, 0] } // ✅ Force 0 votes if no votes exist
                }
            }
        ]);

        console.log("📡 Live Vote Count Data:", voteCounts);
        res.json(voteCounts);
    } catch (error) {
        console.error("❌ Error fetching live vote count:", error);
        res.status(500).json({ message: "Server error fetching live vote count" });
    }
};





// ✅ 2️⃣ Get Vote Distribution by Region
exports.getVoteDistributionByRegion = async (req, res) => {
    try {
        const { electionId } = req.params;
        if (!electionId) return res.status(400).json({ message: "Election ID is required" });

        const regionVoteCount = await Vote.aggregate([
            { $match: { electionId } },
            { $lookup: { from: "voters", localField: "voterId", foreignField: "_id", as: "voter" } },
            { $unwind: "$voter" },
            { $group: { _id: "$voter.constituency", votes: { $sum: 1 } } },
            { $project: { region: "$_id", votes: 1, _id: 0 } }
        ]);

        res.status(200).json(regionVoteCount);
    } catch (error) {
        console.error("❌ Error fetching region-wise vote distribution:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// ✅ 3️⃣ Generate Election Result Report
exports.getElectionResults = async (req, res) => {
    try {
        const { electionId } = req.params;
        if (!electionId) return res.status(400).json({ message: "Election ID is required" });

        const election = await Election.findById(electionId);
        if (!election) return res.status(404).json({ message: "Election not found" });

        const candidates = await Candidate.find({ election: electionId });
        const votes = await Vote.find({ electionId });

        const results = candidates.map(candidate => ({
            candidate: candidate.name,
            votes: votes.filter(v => v.candidateId.toString() === candidate._id.toString()).length
        }));

        res.status(200).json({ election: election.title, results });
    } catch (error) {
        console.error("❌ Error fetching election results:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};