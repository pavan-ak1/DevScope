const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const Voter = require("../models/Voter");
const { sendOtp } = require("../utils/otpService");

const router = express.Router();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// 📌 1️⃣ Signup
router.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingUser = await Voter.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new Voter({ name, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: "Signup successful" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// 📌 2️⃣ Login with Email (Set Token in HTTP-Only Cookie)
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await Voter.findOne({ email });
        if (!user) return res.status(400).json({ error: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1d" });

        // ✅ Set token in HTTP-only cookie
        res.cookie("token", token, {
            httpOnly: true, 
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            maxAge: 24 * 60 * 60 * 1000, // 1 day
        }).json({ success: true, message: "Login successful" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 📌 3️⃣ Google OAuth Login (Set Token in Cookie)
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get("/google/callback", passport.authenticate("google", { session: false }), async (req, res) => {
    const token = jwt.sign({ id: req.user._id }, JWT_SECRET, { expiresIn: "1d" });

    res.cookie("token", token, {
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 24 * 60 * 60 * 1000,
    });

    if (!req.user.phone) {
        return res.redirect(`/profile-update.html`);
    }
    
    res.redirect(`/dashboard.html`);
});

// 📌 4️⃣ Logout (Clear Token)
router.post("/logout", (req, res) => {
    res.clearCookie("token").json({ success: true, message: "Logged out successfully" });
});

module.exports = router;
