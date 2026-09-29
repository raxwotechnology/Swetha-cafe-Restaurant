const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

dotenv.config({ path: path.join(__dirname, ".env") });

const restoreRecoveredClean = async () => {
  const recoveryFilePath = path.join(__dirname, "recovery_data.json");
  if (!fs.existsSync(recoveryFilePath)) {
    console.error(`Recovery data file not found: ${recoveryFilePath}`);
    process.exit(1);
  }

  try {
    const rawData = fs.readFileSync(recoveryFilePath, "utf-8");
    const collections = JSON.parse(rawData);

    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB for restoring recovered data...");

    const db = mongoose.connection.db;

    for (const [collName, docs] of Object.entries(collections)) {
      if (docs.length === 0) continue;

      // Filter out invalid/diff-only documents
      const validDocs = docs.filter(doc => {
        // Skip delta/diff documents that don't contain real data fields
        if (doc.diff) return false;
        
        // Collection-specific validation
        if (collName === "orders" && !doc.invoiceNo) return false;
        if (collName === "customers" && !doc.phone) return false;
        if (collName === "menus" && !doc.name) return false;
        if (collName === "users" && !doc.email) return false;
        if (collName === "invoicecounters" && !doc.date) return false;

        return true;
      });

      if (validDocs.length === 0) {
        console.log(`Skipping collection "${collName}" - no valid full documents reconstructed.`);
        continue;
      }

      console.log(`Restoring ${validDocs.length} valid documents to collection "${collName}"...`);

      // Clear current contents of the collection
      await db.collection(collName).deleteMany({});

      const processedDocs = validDocs.map(doc => {
        const newDoc = { ...doc };
        
        // Convert _id to ObjectId
        if (newDoc._id) {
          if (newDoc._id.$oid) {
            newDoc._id = new mongoose.Types.ObjectId(newDoc._id.$oid);
          } else if (typeof newDoc._id === "string") {
            newDoc._id = new mongoose.Types.ObjectId(newDoc._id);
          }
        }

        // Convert date fields
        for (const [key, val] of Object.entries(newDoc)) {
          if (val && val.$date) {
            newDoc[key] = new Date(val.$date);
          } else if (key === "createdAt" || key === "updatedAt" || key === "date" || key === "statusUpdatedAt") {
            if (typeof val === "string") {
              newDoc[key] = new Date(val);
            }
          }
        }

        // Convert nested menuIds in order items
        if (newDoc.items && Array.isArray(newDoc.items)) {
          newDoc.items = newDoc.items.map(item => {
            const newItem = { ...item };
            if (newItem.menuId && newItem.menuId.$oid) {
              newItem.menuId = new mongoose.Types.ObjectId(newItem.menuId.$oid);
            } else if (newItem.menuId && typeof newItem.menuId === "string") {
              newItem.menuId = new mongoose.Types.ObjectId(newItem.menuId);
            }
            return newItem;
          });
        }

        return newDoc;
      });

      // Insert in chunks
      const chunkSize = 500;
      let insertedCount = 0;
      for (let i = 0; i < processedDocs.length; i += chunkSize) {
        const chunk = processedDocs.slice(i, i + chunkSize);
        try {
          await db.collection(collName).insertMany(chunk, { ordered: false });
          insertedCount += chunk.length;
        } catch (insertErr) {
          console.error(`Partial insert error in "${collName}":`, insertErr.message);
          // If some documents succeeded, add them to the count
          if (insertErr.result && insertErr.result.nInserted) {
            insertedCount += insertErr.result.nInserted;
          }
        }
      }
      console.log(`Successfully restored ${insertedCount} documents to "${collName}"!`);
    }

    console.log("All restorable recovered data has been restored successfully!");

  } catch (err) {
    console.error("Restoring recovered data failed:", err.message);
  } finally {
    process.exit(0);
  }
};

restoreRecoveredClean();
