const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const passport = require("passport");
const connectDb = require("./db/connectDb");
const path = require("path");
const cookieParser = require("cookie-parser");
const WebSocket = require("ws"); // ✅ Added WebSocket Support

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
const server = require("http").createServer(app); // ✅ WebSocket requires HTTP server
const wss = new WebSocket.Server({ server }); // ✅ Create WebSocket server

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

// ✅ WebSocket Connection
wss.on("connection", (ws) => {
    console.log("🟢 WebSocket Client Connected");

    ws.on("message", (message) => {
        console.log("📩 Received message:", message);
    });

    ws.on("close", () => {
        console.log("🔴 WebSocket Client Disconnected");
    });
});

// ✅ Function to Send Live Vote Count to WebSocket Clients
const sendLiveVoteCount = async (electionId) => {
    try {
        const Vote = require("./models/Vote"); // Load Vote Model
        const liveVotes = await Vote.aggregate([
            { $match: { electionId: mongoose.Types.ObjectId(electionId) } },
            { $group: { _id: "$candidateId", voteCount: { $sum: 1 } } }
        ]);

        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(liveVotes));
            }
        });

        console.log("📡 Sent live vote update:", liveVotes);
    } catch (error) {
        console.error("❌ Error sending live vote count:", error);
    }
};

// ✅ Modified `castVote` Function to Send Live Updates
const castVote = async (req, res) => {
    try {
        const { electionId, voterId, candidateId } = req.body;
        const Vote = require("./models/Vote"); // Load Vote Model
        const vote = new Vote({ electionId, voterId, candidateId });
        await vote.save();

        sendLiveVoteCount(electionId); // ✅ Trigger live update
        res.status(201).json({ message: "Vote recorded successfully", vote });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

const port = process.env.PORT || 5000;

const start = async () => {
    try {
        await connectDb(process.env.MONGO_URI);
        server.listen(port, () => { // ✅ Change from `app.listen` to `server.listen`
            console.log(`✅ Server running on port ${port}`);
        });
    } catch (error) {
        console.error("❌ Error starting server:", error);
    }
};

start();
