const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const checkAllDbs = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB.");

    const adminDb = mongoose.connection.client.db("admin");
    const dbs = await adminDb.admin().listDatabases();
    console.log("Available databases on the cluster:");
    dbs.databases.forEach(db => {
      console.log(`- Name: ${db.name}, Size: ${(db.sizeOnDisk / (1024 * 1024)).toFixed(2)} MB`);
    });

  } catch (err) {
    console.error("Failed to list databases:", err.message);
  } finally {
    process.exit(0);
  }
};

checkAllDbs();
