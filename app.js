const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const passport = require("passport");
const connectDb = require("./db/connectDb");
const path = require("path");
const cookieParser = require("cookie-parser");

dotenv.config();
require("./config/passport");

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const electionCommissionRoutes = require("./routes/electionCommissionRoutes");
const electionRoutes = require("./routes/electionRoutes");
const partyRoutes = require("./routes/partyRoutes");
const candidateRoutes = require("./routes/candidateRoutes");
const voteRoutes = require("./routes/voteRoutes");
const voterRoutes = require("./routes/voterRoutes");

const app = express();

// ✅ Allow credentials (cookies) in CORS
app.use(cors({
    origin: "http://localhost:5500",  // Change this to your frontend URL
    credentials: true // ✅ Allow sending cookies
}));

app.use(express.json());
app.use(cookieParser()); // ✅ Enable cookie parsing
app.use(passport.initialize());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.send("Voter Verification API is Running! 🚀");
});

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/election-commission", electionCommissionRoutes);
app.use("/api/v1/elections", electionRoutes);
app.use("/api/v1/parties", partyRoutes);
app.use("/api/v1/candidates", candidateRoutes);
app.use("/api/v1/votes", voteRoutes);
app.use("/api/v1/voters", voterRoutes);

const port = process.env.PORT || 5000;

const start = async () => {
    try {
        await connectDb(process.env.MONGO_URI);
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    } catch (error) {
        console.error("Error starting server:", error);
    }
};

start();
