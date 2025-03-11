const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema({
    electionId: { type: mongoose.Schema.Types.ObjectId, ref: "Election", required: true },
    voterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate", required: true },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Vote", voteSchema);
