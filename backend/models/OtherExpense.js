// backend/models/OtherExpense.js
const mongoose = require("mongoose");

const otherExpenseSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true
  },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  description: String,
  paymentMethod: {
    type: String,
    default: "Cash"
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
});

otherExpenseSchema.index({ date: -1 });

module.exports = mongoose.model("OtherExpense", otherExpenseSchema);