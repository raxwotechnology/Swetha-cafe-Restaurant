const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

dotenv.config({ path: path.join(__dirname, ".env") });

const reconstructStaff = async () => {
  const recoveryFilePath = path.join(__dirname, "recovery_data.json");
  if (!fs.existsSync(recoveryFilePath)) {
    console.error(`Recovery data file not found: ${recoveryFilePath}`);
    process.exit(1);
  }

  try {
    const rawData = fs.readFileSync(recoveryFilePath, "utf-8");
    const collections = JSON.parse(rawData);
    const orders = collections.orders || [];

    console.log("Scanning orders to extract waiters and drivers...");

    const uniqueWaiters = {};
    const uniqueDrivers = new Set();

    for (const order of orders) {
      // Extract Waiters
      const waiterId = order.waiterId ? (order.waiterId.$oid || order.waiterId) : null;
      const waiterName = order.waiterName;

      if (waiterId && waiterName) {
        const idStr = waiterId.toString();
        if (!uniqueWaiters[idStr]) {
          uniqueWaiters[idStr] = waiterName;
        }
      }

      // Extract Drivers
      const driverId = order.driverId ? (order.driverId.$oid || order.driverId) : null;
      if (driverId) {
        uniqueDrivers.add(driverId.toString());
      }
    }

    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB for restoring staff...");

    const db = mongoose.connection.db;

    // 1. Reconstruct and Restore Employees (Waiters)
    const employeeDocs = Object.entries(uniqueWaiters).map(([idStr, name], idx) => {
      return {
        _id: new mongoose.Types.ObjectId(idStr),
        id: `EMP-${String(100 + idx).padStart(4, "0")}`,
        name: name,
        nic: `REC-NIC-${idx}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        phone: `077000${String(idx).padStart(4, "0")}`,
        basicSalary: 25000,
        workingHours: 8,
        otHourRate: 100,
        role: "Waiter",
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });

    if (employeeDocs.length > 0) {
      for (const emp of employeeDocs) {
        await db.collection("employees").updateOne(
          { _id: emp._id },
          { $setOnInsert: emp },
          { upsert: true }
        );
      }
      console.log(`Successfully restored/merged ${employeeDocs.length} original employee (waiter) profiles.`);
    }

    // 2. Reconstruct and Restore Drivers
    const driverDocs = Array.from(uniqueDrivers).map((idStr, idx) => {
      return {
        _id: new mongoose.Types.ObjectId(idStr),
        name: `Recovered Driver ${idx + 1}`,
        nic: `REC-DRV-${idx}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        vehicle: "Motorbike",
        numberPlate: `WP-REC-${idx}`,
        address: "RECOVERED",
        phone: `071000${String(idx).padStart(4, "0")}`,
        addedBy: adminId // Use the adminId we found
      };
    });

    if (driverDocs.length > 0) {
      for (const driver of driverDocs) {
        await db.collection("drivers").updateOne(
          { _id: driver._id },
          { $setOnInsert: driver },
          { upsert: true }
        );
      }
      console.log(`Successfully restored/merged ${driverDocs.length} original driver profiles.`);
    }

    console.log("Staff reconstruction and restoration completed!");

  } catch (err) {
    console.error("Staff reconstruction failed:", err.message);
  } finally {
    process.exit(0);
  }
};

reconstructStaff();
