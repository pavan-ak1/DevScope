const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Voter = require("./models/Voter"); // Import your updated Voter model

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.error("❌ MongoDB Connection Failed", err));

const createTestVoter = async () => {
    try {
        const electionId = "65f123456abcd123ef123456"; // Replace with a real Election ID

        const voter = new Voter({
            name: "Alice Johnson",
            email: "alice@example.com",
            password: "hashedpassword123",  // In real scenarios, use bcrypt
            phone: "9876543210",
            googleId: null,
            election: electionId,
            nationalId: "NID987654321",
            age: 28,  // New field
            constituency: "District 5",  // New field
            verified: false,  // New field
            status: "Pending",  // New field
        });

        await voter.save();
        console.log("✅ Test Voter Created:", voter);
    } catch (error) {
        console.error("❌ Error adding voter:", error);
    } finally {
        mongoose.connection.close(); // Close DB connection after operation
    }
};

// Run function
createTestVoter();
