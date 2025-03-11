const mongoose = require("mongoose");

const voterSchema = new mongoose.Schema({
    name: { type: String },
    email: { type: String, unique: true, sparse: true },
    password: { type: String },
    phone: { type: String, unique: true, sparse: true },
    googleId: { type: String, unique: true, sparse: true }
}, { timestamps: true });

module.exports = mongoose.model("Voter", voterSchema);
