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

// 📌 2️⃣ Login with Email
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await Voter.findOne({ email });
        if (!user) return res.status(400).json({ error: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1d" });
        res.json({ success: true, token, user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 📌 3️⃣ Google OAuth Login
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get("/google/callback", passport.authenticate("google", { session: false }), async (req, res) => {
    const token = jwt.sign({ id: req.user._id }, JWT_SECRET, { expiresIn: "1d" });
    
    if (!req.user.phone) {
        return res.redirect(`/profile-update.html?token=${token}`);
    }
    
    res.redirect(`/dashboard.html?token=${token}`);
});

// 📌 4️⃣ Send OTP to Phone
router.post("/send-otp", async (req, res) => {
    const { phone } = req.body;

    try {
        const user = await Voter.findOne({ phone });
        if (!user) return res.status(400).json({ error: "Phone number not registered" });

        sendOtp(phone);
        res.json({ success: true, message: "OTP sent successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 📌 5️⃣ Verify OTP (For Login)
router.post("/verify-otp", async (req, res) => {
    const { phone, otp } = req.body;

    if (otp !== "123456") return res.status(400).json({ error: "Invalid OTP" });

    let user = await Voter.findOne({ phone });
    if (!user) {
        user = new Voter({ phone });
        await user.save();
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1d" });
    res.json({ success: true, token, user });
});

module.exports = router;
