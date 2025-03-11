const mongoose = require("mongoose");

const CandidateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    party: { type: mongoose.Schema.Types.ObjectId, ref: "Party", required: true },
    election: { type: mongoose.Schema.Types.ObjectId, ref: "Election", required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" }
}, { timestamps: true });

module.exports = mongoose.model("Candidate", CandidateSchema);
