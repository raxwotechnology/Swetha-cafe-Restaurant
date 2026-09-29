// backend/clear_except_users.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

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
const RestaurantSetting = require("./models/RestaurantSetting");
const InvoiceCounter = require("./models/InvoiceCounter");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully.");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

const runWipe = async () => {
  await connectDB();
  console.log("Wiping all database data except logins and essential settings...");

  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const keepCollections = ["users", "restaurantsettings", "currencysettings", "servicecharges", "deliverycharges"];

    for (const col of collections) {
      const colName = col.name;
      if (!keepCollections.includes(colName)) {
        await db.collection(colName).deleteMany({});
        console.log(`Cleared collection: ${colName}`);
      }
    }

    // Ensure permanent login users exist and have correct credentials
    const { ensurePermanentUsers } = require("./config/permanentUsers");
    await ensurePermanentUsers();
    console.log("Permanent users (Admin, Cashier, Kitchen) verified and preserved.");

    // Ensure default settings exist
    const currencyExists = await CurrencySetting.findOne({});
    if (!currencyExists) {
      await new CurrencySetting({ currency: "LKR", symbol: "Rs." }).save();
    }

    const serviceChargeExists = await ServiceCharge.findOne({});
    if (!serviceChargeExists) {
      await new ServiceCharge({ dineInCharge: 10, isActive: true }).save();
    }

    const deliveryChargeExists = await DeliveryCharge.findOne({});
    if (!deliveryChargeExists) {
      await new DeliveryCharge({ amount: 300, isActive: true }).save();
    }

    const restaurantSetting = await RestaurantSetting.findOne({});
    if (!restaurantSetting) {
      await new RestaurantSetting({
        name: "A&A Roasted Chicken",
        address: "337C, Galle Road, Mt. Lavinia",
        phone: "0769 886 887",
        email: "aandafoods2026@gmail.com",
        logo: ""
      }).save();
    }

    console.log("Settings verified.");
    console.log("=================================================");
    console.log("DATABASE CLEANED & LOGINS PRESERVED SUCCESSFULLY!");
    console.log("=================================================");
  } catch (err) {
    console.error("Error clearing database:", err.message);
  } finally {
    process.exit(0);
  }
};

runWipe();
