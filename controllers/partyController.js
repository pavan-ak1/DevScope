const Party = require("../models/Party");

// ✅ Get all parties
exports.getParties = async (req, res) => {
    const parties = await Party.find();
    res.json(parties);
};

// ✅ Add new party
exports.addParty = async (req, res) => {
    const { name, logo, symbol } = req.body;
    const party = new Party({ name, logo, symbol });
    await party.save();
    res.status(201).json(party);
};

// ✅ Update Party
exports.updateParty = async (req, res) => {
    const { id } = req.params;
    const { name, logo, symbol } = req.body;
    const updatedParty = await Party.findByIdAndUpdate(id, { name, logo, symbol }, { new: true });
    res.json(updatedParty);
};

// ✅ Delete Party
exports.deleteParty = async (req, res) => {
    await Party.findByIdAndDelete(req.params.id);
    res.json({ message: "Party Deleted" });
};
