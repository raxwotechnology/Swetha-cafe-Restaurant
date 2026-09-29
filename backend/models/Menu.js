// backend/models/Menu.js
const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
    // ✅ Removed unique constraint
  },
  description: String,
  price: {
    type: Number,
    required: true
  },
  cost: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    default: "Main Course"
  },
  imageUrl: {
    type: String,
    default: "https://storage.googleapis.com/your-menu-images-bucket/default.jpg "
  },
  isActive: {
    type: Boolean,
    default: true
  },
  minimumQty: {
    type: Number,
    default: 5
  },
  currentQty: {
    type: Number,
    default: function () {
      return this.minimumQty || 5;
    }
  },
  menuStatus: {
    type: String,
    enum: ["In Stock", "Low Stock", "Out of Stock"],
    default: "In Stock"
  },
  netProfit: {
    type: Number,
    default: function () {
      return this.price - this.cost;
    }
  }
},{ timestamps: true });

menuSchema.index({ category: 1, isActive: 1 });
menuSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Menu", menuSchema);