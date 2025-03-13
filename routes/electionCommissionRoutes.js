const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const ElectionCommission = require("../models/ElectionCommission");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "f82106d889b7e9d5c89c31a978c1d567";


// 📌 Election Commission Login (Set Token in HTTP-Only Cookie)
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await ElectionCommission.findOne({ email });
        if (!user) return res.status(400).json({ success: false, error: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ success: false, error: "Invalid credentials" });

        const token = jwt.sign({ id: user._id, role: "electionCommission" }, process.env.JWT_SECRET, { expiresIn: "1d" });

        // ✅ Store token in HTTP-only cookie
        res.cookie("token", token, {
            httpOnly: true,  // ❌ Set to false for debugging, then change back to true
            secure: process.env.NODE_ENV === "production",
            sameSite: "Lax",
            maxAge: 24 * 60 * 60 * 1000, // 1-day expiration
        });

        res.json({ success: true, token });
    } catch (error) {
        res.status(500).json({ success: false, error: "Server error" });
    }
});


// 📌 Logout Route (Clear Token)
router.post("/logout", (req, res) => {
    res.clearCookie("token", { path: "/" });
    res.json({ success: true, message: "Logged out successfully" });
});



module.exports = router;
