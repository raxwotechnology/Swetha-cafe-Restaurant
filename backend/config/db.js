const mongoose = require("mongoose");

const { ensurePermanentUsers } = require("./permanentUsers");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10, // Prevent uncontrolled connection accumulation
      minPoolSize: 2,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });
    console.log("MongoDB connected successfully");
    // Ensure permanent login accounts are always present in the database
    await ensurePermanentUsers();
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;