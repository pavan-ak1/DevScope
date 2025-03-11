const mongoose = require("mongoose");

const electionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    candidates: [{ name: String, party: String }],
    status: { type: String, enum: ["Upcoming", "Ongoing", "Completed"], default: "Upcoming" }
});

module.exports = mongoose.model("Election", electionSchema);
