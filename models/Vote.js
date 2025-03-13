const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema({
    electionId: { type: mongoose.Schema.Types.ObjectId, ref: "Election", required: true },
    voterId: { type: mongoose.Schema.Types.ObjectId, ref: "Voter", required: true, unique:true }, // Fixed reference
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate", required: true },
    timestamp: { type: Date, default: Date.now }
});

// Prevent duplicate votes in the same election
voteSchema.index({ voterId: 1, electionId: 1 }, { unique: true });

module.exports = mongoose.model("Vote", voteSchema);
