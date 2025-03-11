const mongoose = require("mongoose");

const PartySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    logo: { type: String, required: true },
    symbol: { type: String, required: true },
});

module.exports = mongoose.model("Party", PartySchema);
