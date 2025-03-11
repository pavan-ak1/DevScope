const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const ElectionCommission = require("./models/ElectionCommission");
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function createAdmin() {
    const email = "admin@election.com"; // Change if needed
    const password = "admin123"; // Change if needed

    // Check if admin already exists
    const existingAdmin = await ElectionCommission.findOne({ email });
    if (existingAdmin) {
        console.log("Admin already exists!");
        mongoose.disconnect();
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new ElectionCommission({
        email,
        password: hashedPassword,
        role: "Super Admin",
    });

    await admin.save();
    console.log("Admin created successfully!");
    mongoose.disconnect();
}

createAdmin();
