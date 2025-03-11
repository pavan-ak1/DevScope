const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const ElectionCommission = require("../models/ElectionCommission");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// 📌 Election Commission Login
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await ElectionCommission.findOne({ email });
        if (!user) return res.status(400).json({ success: false, error: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ success: false, error: "Invalid credentials" });

        const token = jwt.sign({ id: user._id, role: "electionCommission" }, "your_secret_key", { expiresIn: "1h" });

        res.json({ success: true, token });
    } catch (error) {
        res.status(500).json({ success: false, error: "Server error" });
    }
});

module.exports = router;
