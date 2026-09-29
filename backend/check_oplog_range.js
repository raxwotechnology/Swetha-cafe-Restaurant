const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const checkOplogRange = async () => {
  try {
    const conn = await mongoose.createConnection(process.env.MONGO_URI + "local").asPromise();
    console.log("Connected to local database.");
    const oplog = conn.collection("oplog.rs");

    const oldest = await oplog.find({}).sort({ ts: 1 }).limit(1).toArray();
    const newest = await oplog.find({}).sort({ ts: -1 }).limit(1).toArray();

    const getSeconds = (ts) => {
      if (!ts) return 0;
      if (typeof ts.getHighBits === "function") return ts.getHighBits();
      if (ts.seconds) return ts.seconds;
      return parseInt(ts.toString());
    };

    if (oldest.length > 0 && newest.length > 0) {
      const oldestSec = getSeconds(oldest[0].ts);
      const newestSec = getSeconds(newest[0].ts);

      console.log("Oldest oplog entry timestamp:", new Date(oldestSec * 1000).toISOString());
      console.log("Newest oplog entry timestamp:", new Date(newestSec * 1000).toISOString());
      console.log("Oplog duration (days):", ((newestSec - oldestSec) / (60 * 60 * 24)).toFixed(2));
    } else {
      console.log("Oplog is empty.");
    }
  } catch (err) {
    console.error("Failed to read oplog range:", err.message);
  } finally {
    process.exit(0);
  }
};

checkOplogRange();
