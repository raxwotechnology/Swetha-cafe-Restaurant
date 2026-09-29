// backend/config/permanentUsers.js
const User = require("../models/User");

const PERMANENT_USERS = [
  {
    name: "Admin User",
    email: "admin@restaurant.com",
    password: "Swetha@2026",
    role: "admin",
    isActive: true,
  },
  {
    name: "Cashier User",
    email: "cashier@restaurant.com",
    password: "Cashier@2026",
    role: "cashier",
    isActive: true,
  },
  {
    name: "Kitchen User",
    email: "kitchen@restaurant.com",
    password: "Kitchen@2026",
    role: "kitchen",
    isActive: true,
  },
];

/**
 * Ensures that the permanent system accounts (Admin, Cashier, Kitchen)
 * exist in the database with their correct credentials, roles, and active status.
 */
const ensurePermanentUsers = async () => {
  try {
    for (const u of PERMANENT_USERS) {
      const existingUser = await User.findOne({ email: u.email });
      if (!existingUser) {
        const newUser = new User({
          name: u.name,
          email: u.email,
          password: u.password,
          role: u.role,
          isActive: true,
        });
        await newUser.save();
        console.log(`[Permanent Users] Created ${u.role} user: ${u.email}`);
      } else {
        let changed = false;
        // Verify password match; if not matching, update and re-hash via pre-save hook
        const passwordMatches = await existingUser.comparePassword(u.password);
        if (!passwordMatches) {
          existingUser.password = u.password;
          changed = true;
        }
        if (existingUser.role !== u.role) {
          existingUser.role = u.role;
          changed = true;
        }
        if (!existingUser.isActive) {
          existingUser.isActive = true;
          changed = true;
        }
        if (changed) {
          await existingUser.save();
          console.log(`[Permanent Users] Updated & verified ${u.role} user: ${u.email}`);
        }
      }
    }
  } catch (err) {
    console.error("[Permanent Users] Error ensuring permanent users:", err.message);
  }
};

module.exports = {
  PERMANENT_USERS,
  ensurePermanentUsers,
};
