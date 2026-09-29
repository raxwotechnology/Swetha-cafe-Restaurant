const Order = require("../models/Order");
const Expense = require("../models/Expense");
const KitchenBill = require("../models/KitchenBill");
const Salary = require("../models/Salary");
const OtherIncome = require("../models/OtherIncome");
const OtherExpense = require("../models/OtherExpense");

// GET /api/auth/report/monthly?month=7&year=2024
exports.getMonthlyReport = async (req, res) => {
  const { month, year } = req.query;

  if (!month || !year) {
    return res.status(400).json({ error: "Month and year are required" });
  }

  try {
    const numYear = parseInt(year);
    const numMonth = parseInt(month);
    const start = new Date(numYear, numMonth - 1, 1, 0, 0, 0, 0);
    const end = new Date(numYear, numMonth, 0, 23, 59, 59, 999);

    const [
      orders,
      supplierExpenses,
      kitchenBills,
      salaries,
      otherIncomes,
      otherExpenses
    ] = await Promise.all([
      Order.find({ createdAt: { $gte: start, $lte: end } }).select("totalPrice createdAt").lean(),
      Expense.find({ date: { $gte: start, $lte: end } }).select("amount date").lean(),
      KitchenBill.find({ date: { $gte: start, $lte: end } }).select("amount date").lean(),
      Salary.find({ date: { $gte: start, $lte: end } }).select("total date").lean(),
      OtherIncome.find({ date: { $gte: start, $lte: end } }).select("amount date").lean(),
      OtherExpense.find({ date: { $gte: start, $lte: end } }).select("amount date").lean()
    ]);

    // Helper: group by day
    const groupByDay = (data, valueKey = "amount", dateKey = "createdAt") => {
      const result = {};
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        if (!item[dateKey]) continue;
        const d = new Date(item[dateKey]);
        const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        result[date] = (result[date] || 0) + (item[valueKey] || 0);
      }
      return result;
    };

    const monthlyIncome = groupByDay(orders, "totalPrice", "createdAt");
    const monthlySupplierExpenses = groupByDay(supplierExpenses, "amount", "date");
    const monthlyBills = groupByDay(kitchenBills, "amount", "date");
    const monthlySalaries = groupByDay(salaries, "total", "date");
    const monthlyOtherIncome = groupByDay(otherIncomes, "amount", "date");
    const monthlyOtherExpenses = groupByDay(otherExpenses, "amount", "date");

    res.json({
      monthlyIncome,
      monthlyOtherIncome,
      monthlySupplierExpenses,
      monthlyBills,
      monthlySalaries,
      monthlyOtherExpenses
    });
  } catch (err) {
    console.error("Failed to generate report:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};