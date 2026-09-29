// backend/checkUsers.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");

dotenv.config();

const checkUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");

    const users = await User.find({});
    console.log(`\nTotal users in database: ${users.length}`);
    
    if (users.length === 0) {
      console.log("⚠️ No users found in database!");
    } else {
      console.log("\nUsers in database:");
      users.forEach(user => {
        console.log(`- ${user.role}: ${user.email} (Active: ${user.isActive})`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error("Error checking users:", error.message);
    process.exit(1);
  }
};

checkUsers();
