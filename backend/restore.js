// backend/restore.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

// Load environment variables
dotenv.config({ path: path.join(__dirname, ".env") });

// Import models
const User = require("./models/User");
const Menu = require("./models/Menu");
const Employee = require("./models/Employee");
const Supplier = require("./models/Supplier");
const Driver = require("./models/Driver");
const Customer = require("./models/Customer");
const Expense = require("./models/Expense");
const OtherExpense = require("./models/OtherExpense");
const OtherIncome = require("./models/OtherIncome");
const Salary = require("./models/Salary");
const Attendance = require("./models/Attendance");
const DeliveryChargeByPlace = require("./models/DeliveryChargeByPlace");
const KitchenBill = require("./models/KitchenBill");
const KitchenRequest = require("./models/KitchenRequest");
const Order = require("./models/Order");
const ServiceCharge = require("./models/ServiceCharge");
const DeliveryCharge = require("./models/DeliveryCharge");
const CurrencySetting = require("./models/CurrencySetting");
const InvoiceCounter = require("./models/InvoiceCounter");

const models = {
  User,
  Menu,
  Employee,
  Supplier,
  Driver,
  Customer,
  Expense,
  OtherExpense,
  OtherIncome,
  Salary,
  Attendance,
  DeliveryChargeByPlace,
  KitchenBill,
  KitchenRequest,
  Order,
  ServiceCharge,
  DeliveryCharge,
  CurrencySetting,
  InvoiceCounter
};

const restore = async () => {
  const backupFolderName = process.argv[2];
  if (!backupFolderName) {
    console.error("Please provide the backup folder name. Example: node restore.js backup-2026-07-04T07-45-00.000Z");
    process.exit(1);
  }

  const backupDir = path.join(__dirname, "backups", backupFolderName);
  if (!fs.existsSync(backupDir)) {
    console.error(`Backup directory not found: ${backupDir}`);
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB for restore...");

    for (const [name, model] of Object.entries(models)) {
      const filePath = path.join(backupDir, `${name}.json`);
      if (fs.existsSync(filePath)) {
        const rawData = fs.readFileSync(filePath, "utf-8");
        const data = JSON.parse(rawData);

        // Clear existing collection
        await model.deleteMany({});

        if (data.length > 0) {
          // Re-insert data
          await model.insertMany(data);
        }
        console.log(`Restored ${data.length} records for ${name}`);
      }
    }

    console.log("Restore completed successfully!");
  } catch (err) {
    console.error("Restore failed:", err.message);
  } finally {
    process.exit(0);
  }
};

restore();
