// backend/backup.js
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

const backup = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB for backup...");

    const backupDir = path.join(__dirname, "backups", `backup-${new Date().toISOString().replace(/:/g, "-")}`);
    fs.mkdirSync(backupDir, { recursive: true });

    for (const [name, model] of Object.entries(models)) {
      const data = await model.find({});
      fs.writeFileSync(path.join(backupDir, `${name}.json`), JSON.stringify(data, null, 2));
      console.log(`Backed up ${data.length} records for ${name}`);
    }

    console.log(`Backup completed successfully! Files saved to: ${backupDir}`);
  } catch (err) {
    console.error("Backup failed:", err.message);
  } finally {
    process.exit(0);
  }
};

backup();
