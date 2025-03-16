const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const passport = require("passport");
const connectDb = require("./db/connectDb");
const path = require("path");
const cookieParser = require("cookie-parser");
const http = require("http");
const socketIo = require("socket.io");

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
const server = http.createServer(app); // ✅ Create HTTP server
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:5500", // Adjust frontend URL if necessary
        credentials: true
    }
});

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

// ✅ WebSocket Connection for Live Voting
io.on("connection", (socket) => {
    console.log("🟢 New WebSocket Connection Established");

    socket.on("voteCast", async (electionId) => {
        try {
            console.log(`📡 Live update requested for Election ID: ${electionId}`);
            const liveVotes = await getLiveVotes(electionId);
            io.emit("updateLiveVotes", liveVotes); // ✅ Send live vote update to all clients
        } catch (error) {
            console.error("❌ Error fetching live votes:", error);
        }
    });

    socket.on("disconnect", () => {
        console.log("🔴 A user disconnected");
    });
});

// ✅ Function to Fetch Live Vote Count
const getLiveVotes = async (electionId) => {
    try {
        const Vote = require("./models/Vote");
        const Candidate = require("./models/Candidate");
        const Party = require("./models/Party");

        const voteCounts = await Vote.aggregate([
            { $match: { electionId: new mongoose.Types.ObjectId(electionId) } },
            {
                $group: {
                    _id: "$candidateId",
                    votes: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "candidates",
                    localField: "_id",
                    foreignField: "_id",
                    as: "candidateData"
                }
            },
            { $unwind: "$candidateData" },
            {
                $lookup: {
                    from: "parties",
                    localField: "candidateData.party",
                    foreignField: "_id",
                    as: "partyData"
                }
            },
            { $unwind: "$partyData" },
            {
                $project: {
                    candidate: "$candidateData.name",
                    party: "$partyData.name",
                    votes: 1
                }
            }
        ]);

        console.log("📡 Live Vote Data Sent:", voteCounts);
        return voteCounts;
    } catch (error) {
        console.error("❌ Error fetching live vote count:", error);
        return [];
    }
};

const port = process.env.PORT || 5000;

// ✅ Start Server and Connect to DB
const start = async () => {
    try {
        console.log("🚀 Attempting to connect to MongoDB...");
        await connectDb(process.env.MONGO_URI);
        
        console.log("✅ Database connected successfully!");

        server.listen(port, () => { // ✅ Corrected to use `server.listen()`
            console.log(`✅ Server & WebSocket running on port ${port}`);
        });
    } catch (error) {
        console.error("❌ Error starting server:", error);
    }
};

start();
