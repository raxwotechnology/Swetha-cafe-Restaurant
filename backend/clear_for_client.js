const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const clearAndSeed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB. Clearing test/sample data...");

    const db = mongoose.connection.db;

    // Clear only transactional/operational collections (keep settings)
    const collsToClear = [
      "orders", "customers", "invoicecounters", "otherexpenses",
      "expenses", "salaries", "attendances", "kitchenbills",
      "kitchenrequests", "otherincomes"
    ];

    for (const c of collsToClear) {
      try {
        await db.collection(c).deleteMany({});
        console.log(`Cleared: ${c}`);
      } catch (e) {
        console.log(`Skipped ${c}: ${e.message}`);
      }
    }

    const { ensurePermanentUsers } = require("./config/permanentUsers");
    await ensurePermanentUsers();

    console.log("Done! Database is now clean and ready for client use.");
    console.log("Settings, menus, users, suppliers, drivers remain intact.");
  } catch (err) {
    console.error("Failed:", err.message);
  } finally {
    process.exit(0);
  }
};

clearAndSeed();
