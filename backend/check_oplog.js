const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const checkOplog = async () => {
  try {
    const conn = await mongoose.createConnection(process.env.MONGO_URI + "local").asPromise();
    console.log("Connected to local database.");
    const oplog = conn.collection("oplog.rs");
    const count = await oplog.countDocuments({});
    console.log("Oplog entries count:", count);
  } catch (err) {
    console.error("Failed to read oplog:", err.message);
  } finally {
    process.exit(0);
  }
};

checkOplog();
