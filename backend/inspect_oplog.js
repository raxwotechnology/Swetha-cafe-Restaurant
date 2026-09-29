const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const inspectOplog = async () => {
  try {
    const conn = await mongoose.createConnection(process.env.MONGO_URI + "local").asPromise();
    console.log("Connected to local database.");
    const oplog = conn.collection("oplog.rs");
    
    // Find operations for test.users
    const userOps = await oplog.find({ ns: "test.users" }).toArray();
    console.log("test.users operations in oplog:", userOps.map(op => ({ op: op.op, ts: op.ts, o: op.o })));

    // Find operations for test.drivers
    const driverOps = await oplog.find({ ns: "test.drivers" }).toArray();
    console.log("test.drivers operations in oplog:", driverOps.map(op => ({ op: op.op, ts: op.ts, o: op.o })));
  } catch (err) {
    console.error("Failed to inspect oplog:", err.message);
  } finally {
    process.exit(0);
  }
};

inspectOplog();
