const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ["admin", "cashier", "kitchen", "waiter"],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 🚀 Compound index: fast lookup by role + isRead (polled every 15s)
notificationSchema.index({ role: 1, isRead: 1 });
// Auto-delete notifications older than 7 days to prevent collection bloat
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

module.exports = mongoose.model("Notification", notificationSchema);