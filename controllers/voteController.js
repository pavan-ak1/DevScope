const Vote = require("../models/Vote");
const Election = require('../models/Election');
const Voter = require("../models/Voter");
const mongoose = require("mongoose");


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