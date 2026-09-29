// backend/models/RestaurantSetting.js
const mongoose = require("mongoose");

const restaurantSettingSchema = new mongoose.Schema({
  name: {
    type: String,
    default: "Swetha Cafe & Restaurant"
  },
  address: {
    type: String,
    default: "337C, Galle Road, Mt. Lavinia"
  },
  phone: {
    type: String,
    default: "0769 886 887"
  },
  email: {
    type: String,
    default: "aandafoods2026@gmail.com"
  },
  logo: {
    type: String,
    default: "" // Base64 data URL
  }
});

module.exports = mongoose.model("RestaurantSetting", restaurantSettingSchema);
