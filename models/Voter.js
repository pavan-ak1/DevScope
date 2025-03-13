const mongoose = require("mongoose");

const voterSchema = new mongoose.Schema({
    name: { type: String },
    email: { type: String, unique: true, sparse: true },
    password: { type: String },
    phone: { type: String, unique: true, sparse: true },
    googleId: { type: String, unique: true, sparse: true },
    election: { type: mongoose.Schema.Types.ObjectId, ref: "Election", required: true },
    hasVoted: { type: Boolean, default: false }, // Ensures a voter can only vote once

    // Voter ID Verification Fields
    nationalId: { type: String, required: true, unique: true }, // Government ID
    age: { type: Number, required: true }, // Age verification
    constituency: { type: String, required: true }, // Voter's region
    verified: { type: Boolean, default: false }, // If voter is verified
    status: { 
        type: String, 
        enum: ["Pending", "Verified", "Rejected"], 
        default: "Pending" 
    }, // Registration status

}, { timestamps: true });

module.exports = mongoose.model("Voter", voterSchema);
