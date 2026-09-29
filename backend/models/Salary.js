const mongoose = require("mongoose");

const salarySchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },
  basicSalary: { type: Number, required: true },
  otHours: { type: Number, default: 0 },
  otRate: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  date: { type: Date, default: Date.now }
});

salarySchema.index({ date: -1 });
salarySchema.index({ employee: 1, date: -1 });

module.exports = mongoose.model("Salary", salarySchema);