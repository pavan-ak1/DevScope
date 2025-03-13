const mongoose = require("mongoose");

const electionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    candidates: [{ type: mongoose.Schema.Types.ObjectId, ref: "Candidate" }],
    status: { type: String, enum: ["Upcoming", "Ongoing", "Completed"], default: "Upcoming" },
    totalVoters: { type: Number, default: 0 },  // Tracks total registered voters
    votesCast: { type: Number, default: 0 }     // Tracks votes cast
});

module.exports = mongoose.model("Election", electionSchema);
