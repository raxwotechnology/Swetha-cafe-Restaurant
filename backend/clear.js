// backend/clear.js
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
const InvoiceCounter = require("./models/InvoiceCounter");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully for clearing.");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

const clearAll = async () => {
  await connectDB();
  console.log("Clearing all seeded data from the database...");

  try {
    await User.deleteMany({});
    await Menu.deleteMany({});
    await Employee.deleteMany({});
    await Supplier.deleteMany({});
    await Driver.deleteMany({});
    await Customer.deleteMany({});
    await Expense.deleteMany({});
    await OtherExpense.deleteMany({});
    await OtherIncome.deleteMany({});
    await Salary.deleteMany({});
    await Attendance.deleteMany({});
    await DeliveryChargeByPlace.deleteMany({});
    await KitchenBill.deleteMany({});
    await KitchenRequest.deleteMany({});
    await Order.deleteMany({});
    await ServiceCharge.deleteMany({});
    await DeliveryCharge.deleteMany({});
    await CurrencySetting.deleteMany({});
    await InvoiceCounter.deleteMany({});
    
    console.log("Database cleared successfully!");
    
    // Ensure permanent login users are recreated
    const { ensurePermanentUsers } = require("./config/permanentUsers");
    await ensurePermanentUsers();
    console.log("Permanent users (Admin, Cashier, Kitchen) recreated & secured.");
  } catch (err) {
    console.error("Error clearing database:", err.message);
  } finally {
    process.exit(0);
  }
};

clearAll();
