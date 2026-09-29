// models/Printer.js
const mongoose = require("mongoose");

const printerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  ipAddress: {
    type: String,
    trim: true,
    default: ""
  },
  port: {
    type: Number,
    default: 9100
  },
  type: {
    type: String,
    enum: ["wifi_network", "qz_tray"],
    default: "wifi_network"
  },
  role: {
    type: String,
    enum: ["kitchen", "cashier"],
    default: "kitchen"
  }
}, { timestamps: true });

module.exports = mongoose.model("Printer", printerSchema);