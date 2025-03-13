const mongoose = require("mongoose");
require('dotenv').config()

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Election = require("./models/Election"); // Adjust path based on your folder structure

async function addCandidateToElection() {
  try {
    await Election.updateOne(
      { _id: "67d16e1286a4adf0915eae8c" },
      { $push: { candidates: "67d170761143bfb55641b0da" } }
    );
    console.log("✅ Candidate added to election successfully!");
  } catch (error) {
    console.error("❌ Error updating election:", error);
  } finally {
    mongoose.connection.close();
  }
}

addCandidateToElection();
