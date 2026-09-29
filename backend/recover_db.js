const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

dotenv.config({ path: path.join(__dirname, ".env") });

const recoverDb = async () => {
  try {
    const conn = await mongoose.createConnection(process.env.MONGO_URI + "local").asPromise();
    console.log("Connected to local database for recovery.");
    const oplog = conn.collection("oplog.rs");

    // Fetch all oplog entries for our namespace
    const cursor = oplog.find({ ns: /^test\./ }).sort({ ts: 1 });
    
    const collections = {};
    let totalCount = 0;

    // We want to reconstruct the database state before 2026-07-04T06:50:00Z (UTC)
    // In oplog, ts is a BSON Timestamp. We can get its seconds using ts.getHighBits() or ts.toNumber() or ts.seconds
    // Let's parse all operations and reconstruct the final state of each document before our seed.
    const cutoffTime = Math.floor(new Date("2026-07-04T06:50:00Z").getTime() / 1000);
    console.log("Cutoff timestamp seconds:", cutoffTime);

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      totalCount++;

      // Extract timestamp seconds
      let seconds = 0;
      if (doc.ts) {
        // MongoDB driver Timestamp representation
        if (typeof doc.ts.getHighBits === "function") {
          seconds = doc.ts.getHighBits();
        } else if (doc.ts.seconds) {
          seconds = doc.ts.seconds;
        } else {
          seconds = parseInt(doc.ts.toString());
        }
      }

      // Ignore operations after cutoff (which is our seeding today)
      if (seconds >= cutoffTime) {
        continue;
      }

      const ns = doc.ns;
      const collName = ns.split(".")[1];
      if (!collections[collName]) {
        collections[collName] = {};
      }

      const op = doc.op;
      if (op === "i") {
        // Insert operation
        const item = doc.o;
        if (item && item._id) {
          collections[collName][item._id.toString()] = item;
        }
      } else if (op === "u") {
        // Update operation
        // doc.o is the update document (e.g. { $set: { ... } } or the new doc replacement)
        // doc.o2 is the query/selector containing _id (e.g. { _id: ObjectId("...") })
        const idObj = doc.o2;
        if (idObj && idObj._id) {
          const idStr = idObj._id.toString();
          const existing = collections[collName][idStr];
          if (existing) {
            const updateObj = doc.o;
            if (updateObj.$set) {
              collections[collName][idStr] = { ...existing, ...updateObj.$set };
            } else if (updateObj.$unset) {
              for (const key of Object.keys(updateObj.$unset)) {
                delete collections[collName][idStr][key];
              }
            } else if (!updateObj.hasOwnProperty("$set") && !updateObj.hasOwnProperty("$unset")) {
              // Replacement update
              collections[collName][idStr] = { _id: idObj._id, ...updateObj };
            }
          }
        }
      } else if (op === "d") {
        // Delete operation
        const idObj = doc.o;
        if (idObj && idObj._id) {
          delete collections[collName][idObj._id.toString()];
        }
      }
    }

    console.log("Oplog scan complete. Reconstructed collections summary:");
    const outputData = {};
    for (const [collName, docsMap] of Object.entries(collections)) {
      const docs = Object.values(docsMap);
      outputData[collName] = docs;
      console.log(`- ${collName}: ${docs.length} documents reconstructed`);
    }

    // Save to a recovery JSON file
    const recoveryFilePath = path.join(__dirname, "recovery_data.json");
    fs.writeFileSync(recoveryFilePath, JSON.stringify(outputData, null, 2));
    console.log(`Successfully saved recovered database state to: ${recoveryFilePath}`);

  } catch (err) {
    console.error("Recovery failed:", err.message);
  } finally {
    process.exit(0);
  }
};

recoverDb();
