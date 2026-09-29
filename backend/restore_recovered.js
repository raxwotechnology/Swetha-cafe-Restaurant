const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

dotenv.config({ path: path.join(__dirname, ".env") });

const restoreRecovered = async () => {
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

      console.log(`Restoring ${docs.length} documents to collection "${collName}"...`);

      // Clear current contents of the collection
      await db.collection(collName).deleteMany({});

      // Parse BSON objects (like Date and ObjectId) if any, but since JSON.parse leaves them as strings,
      // let's convert date strings back to Date objects and _id strings back to ObjectId if possible
      // to preserve correct types!
      const processedDocs = docs.map(doc => {
        const newDoc = { ...doc };
        
        // Convert _id to ObjectId
        if (newDoc._id) {
          if (newDoc._id.$oid) {
            newDoc._id = new mongoose.Types.ObjectId(newDoc._id.$oid);
          } else if (typeof newDoc._id === "string") {
            newDoc._id = new mongoose.Types.ObjectId(newDoc._id);
          }
        }

        // Convert any date strings or MongoDB date objects back to Date
        for (const [key, val] of Object.entries(newDoc)) {
          if (val && val.$date) {
            newDoc[key] = new Date(val.$date);
          } else if (key === "createdAt" || key === "updatedAt" || key === "date" || key === "statusUpdatedAt") {
            if (typeof val === "string") {
              newDoc[key] = new Date(val);
            }
          }
        }

        // Also convert subdocument arrays or objects (like order items, etc.)
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

      // Insert documents in chunks of 500 to avoid BSON limit issues
      const chunkSize = 500;
      for (let i = 0; i < processedDocs.length; i += chunkSize) {
        const chunk = processedDocs.slice(i, i + chunkSize);
        await db.collection(collName).insertMany(chunk);
      }
      console.log(`Successfully restored "${collName}" collection!`);
    }

    console.log("All recovered data has been restored successfully!");

  } catch (err) {
    console.error("Restoring recovered data failed:", err.message);
  } finally {
    process.exit(0);
  }
};

restoreRecovered();
