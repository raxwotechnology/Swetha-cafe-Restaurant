const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const dumpOplog = async () => {
  try {
    const conn = await mongoose.createConnection(process.env.MONGO_URI + "local").asPromise();
    console.log("Connected to local database.");
    const oplog = conn.collection("oplog.rs");
    
    // Find unique namespaces (ns) in oplog
    const namespaces = await oplog.distinct("ns");
    console.log("Unique namespaces in oplog:", namespaces);

    // Let's count operations grouped by op type
    const opTypes = await oplog.aggregate([
      { $group: { _id: "$op", count: { $sum: 1 } } }
    ]).toArray();
    console.log("Operation types in oplog:", opTypes);
  } catch (err) {
    console.error("Failed to read oplog namespaces:", err.message);
  } finally {
    process.exit(0);
  }
};

dumpOplog();
