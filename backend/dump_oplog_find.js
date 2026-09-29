const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const dumpOplogFind = async () => {
  try {
    const conn = await mongoose.createConnection(process.env.MONGO_URI + "local").asPromise();
    console.log("Connected to local database.");
    const oplog = conn.collection("oplog.rs");
    
    // Find documents manually using cursor
    const cursor = oplog.find({});
    
    const namespaces = new Set();
    const opTypes = {};
    let count = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      count++;
      if (doc.ns) {
        namespaces.add(doc.ns);
      }
      if (doc.op) {
        opTypes[doc.op] = (opTypes[doc.op] || 0) + 1;
      }
      if (count >= 5000) break; // safety limit
    }

    console.log("Total scanned docs:", count);
    console.log("Unique namespaces found:", Array.from(namespaces));
    console.log("Operation types found:", opTypes);

  } catch (err) {
    console.error("Failed to read oplog using find:", err.message);
  } finally {
    process.exit(0);
  }
};

dumpOplogFind();
