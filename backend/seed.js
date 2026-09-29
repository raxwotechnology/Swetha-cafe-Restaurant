// backend/seed.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");

dotenv.config();

const seedUsers = [
  {
    name: "Admin User",
    email: "admin@restaurant.com",
    password: "Swetha@2026",
    role: "admin",
    isActive: true,
  },
  {
    name: "Cashier User",
    email: "cashier@restaurant.com",
    password: "Cashier@2026",
    role: "cashier",
    isActive: true,
  },
  {
    name: "Kitchen User",
    email: "kitchen@restaurant.com",
    password: "Kitchen@2026",
    role: "kitchen",
    isActive: true,
  },
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });
    console.log("MongoDB connected successfully");

    // Clear existing users (optional - remove if you want to keep existing users)
    await User.deleteMany({});
    console.log("Cleared existing users");

    // Insert seed users using save() to trigger password hashing
    for (const userData of seedUsers) {
      const user = new User(userData);
      await user.save();
      console.log(`- ${user.role}: ${user.email}`);
    }
    console.log("Seed users created successfully:");

    console.log("\n✅ Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error.message);
    process.exit(1);
  }
};

seedDatabase();
