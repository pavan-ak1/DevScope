const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const passport = require("passport");
const connectDb = require("./db/connectDb");
const path = require("path");

dotenv.config();
require("./config/passport"); 

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const electionCommissionRoutes = require("./routes/electionCommissionRoutes");
const electionRoutes = require("./routes/electionRoutes");
const partyRoutes = require("./routes/partyRoutes");
const candidateRoutes = require("./routes/candidateRoutes");

const app = express();
app.use(cors());
app.use(express.json());

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
