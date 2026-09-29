// backend/testLogin.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");

dotenv.config();

const testLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");

    const testCredentials = [
      { email: "admin@restaurant.com", password: "Swetha@2026", role: "admin" },
      { email: "cashier@restaurant.com", password: "Cashier@2026", role: "cashier" },
      { email: "kitchen@restaurant.com", password: "Kitchen@2026", role: "kitchen" },
    ];

    console.log("\nTesting login credentials:");
    for (const cred of testCredentials) {
      const user = await User.findOne({ email: cred.email });
      if (user) {
        const passwordMatch = await user.comparePassword(cred.password);
        console.log(`- ${cred.role}: ${cred.email} - Password ${passwordMatch ? '✅ MATCH' : '❌ MISMATCH'} (Active: ${user.isActive})`);
      } else {
        console.log(`- ${cred.role}: ${cred.email} - ❌ USER NOT FOUND`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error("Error testing login:", error.message);
    process.exit(1);
  }
};

testLogin();
