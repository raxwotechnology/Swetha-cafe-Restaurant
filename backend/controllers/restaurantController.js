// backend/controllers/restaurantController.js
const RestaurantSetting = require("../models/RestaurantSetting");

exports.getRestaurantSetting = async (req, res) => {
  try {
    let setting = await RestaurantSetting.findOne({});
    if (!setting) {
      // Return defaults if none exists
      setting = {
        name: "Swetha Cafe & Restaurant",
        address: "337C, Galle Road, Mt. Lavinia",
        phone: "0769 886 887",
        email: "aandafoods2026@gmail.com",
        logo: ""
      };
    }
    res.json(setting);
  } catch (err) {
    res.status(500).json({ error: "Failed to load restaurant settings" });
  }
};

exports.updateRestaurantSetting = async (req, res) => {
  const { name, address, phone, email, logo } = req.body;

  try {
    let setting = await RestaurantSetting.findOne({});
    if (!setting) {
      setting = new RestaurantSetting({ name, address, phone, email, logo: logo || "" });
    } else {
      if (name !== undefined) setting.name = name;
      if (address !== undefined) setting.address = address;
      if (phone !== undefined) setting.phone = phone;
      if (email !== undefined) setting.email = email;
      if (logo !== undefined) setting.logo = logo;
    }

    await setting.save();
    res.json(setting);
  } catch (err) {
    res.status(500).json({ error: "Failed to update restaurant settings" });
  }
};
