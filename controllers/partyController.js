const Party = require("../models/Party");

// ✅ Get all parties
exports.getParties = async (req, res) => {
    try {
        const parties = await Party.find({}, "name symbol logo _id");
        res.json(parties);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ✅ Add new party
exports.addParty = async (req, res) => {
    try {

        const { name, symbol } = req.body;
        if (!req.file) {
            return res.status(400).json({ error: "Logo image is required" });
        }

        const logo = req.file.path; // Cloudinary URL

        const party = new Party({ name, logo, symbol });
        await party.save();



        res.status(201).json({ message: "Party created successfully", party });
    } catch (error) {
        console.error("Error adding party:", error);
        res.status(500).json({ error: error.message });
    }
};




// ✅ Update Party
exports.updateParty = async (req, res) => {
    try {


        const { id } = req.params;
        const { name, symbol } = req.body;
        const logo = req.file ? req.file.path : null; // Only update if file exists

        const updateData = { name, symbol };
        if (logo) updateData.logo = logo; // Only update logo if a new file was uploaded

        const updatedParty = await Party.findByIdAndUpdate(id, updateData, { new: true });

        if (!updatedParty) {
            return res.status(404).json({ error: "Party not found" });
        }

        res.json({ message: "Party updated successfully", party: updatedParty });
    } catch (error) {
        console.error("Error updating party:", error);
        res.status(500).json({ error: error.message });
    }
};


// ✅ Delete Party
exports.deleteParty = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedParty = await Party.findByIdAndDelete(id);

        if (!deletedParty) {
            return res.status(404).json({ success: false, message: "Party not found" });
        }

        res.json({ success: true, message: "Party deleted successfully!" });
    } catch (error) {
        console.error("Error deleting party:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};