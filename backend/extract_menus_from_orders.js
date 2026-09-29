const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

dotenv.config({ path: path.join(__dirname, ".env") });

const extractMenus = async () => {
  const recoveryFilePath = path.join(__dirname, "recovery_data.json");
  if (!fs.existsSync(recoveryFilePath)) {
    console.error(`Recovery data file not found: ${recoveryFilePath}`);
    process.exit(1);
  }

  try {
    const rawData = fs.readFileSync(recoveryFilePath, "utf-8");
    const collections = JSON.parse(rawData);
    const orders = collections.orders || [];

    console.log(`Scanning ${orders.length} orders to extract menu items...`);

    const uniqueMenus = {};

    for (const order of orders) {
      if (order.items && Array.isArray(order.items)) {
        for (const item of order.items) {
          const menuId = item.menuId ? (item.menuId.$oid || item.menuId) : null;
          if (!menuId) continue;

          const idStr = menuId.toString();

          if (!uniqueMenus[idStr]) {
            // Estimate cost: price - netProfit
            const price = parseFloat(item.price) || 0;
            const netProfit = parseFloat(item.netProfit) || 0;
            const cost = Math.max(0, price - netProfit);

            // Guess category from name
            const nameLower = (item.name || "").toLowerCase();
            let category = "Main Course";
            if (nameLower.includes("rice") || nameLower.includes("pizza") || nameLower.includes("pasta") || nameLower.includes("spaghetti") || nameLower.includes("kottu") || nameLower.includes("noodles")) {
              category = "Main Course";
            } else if (nameLower.includes("burger") || nameLower.includes("sandwich") || nameLower.includes("submarine")) {
              category = "Burgers & Sandwiches";
            } else if (nameLower.includes("juice") || nameLower.includes("coke") || nameLower.includes("pepsi") || nameLower.includes("coffee") || nameLower.includes("tea") || nameLower.includes("beverage") || nameLower.includes("water") || nameLower.includes("sprite") || nameLower.includes("mojito")) {
              category = "Beverages";
            } else if (nameLower.includes("brownie") || nameLower.includes("ice cream") || nameLower.includes("cake") || nameLower.includes("pudding") || nameLower.includes("dessert") || nameLower.includes("waffle")) {
              category = "Desserts";
            } else if (nameLower.includes("fries") || nameLower.includes("roll") || nameLower.includes("soup") || nameLower.includes("salad") || nameLower.includes("starter") || nameLower.includes("appetizer")) {
              category = "Starters";
            }

            uniqueMenus[idStr] = {
              _id: new mongoose.Types.ObjectId(idStr),
              name: item.name,
              description: `${item.name} - Reconstructed from order history.`,
              price: price,
              cost: cost,
              category: category,
              imageUrl: item.imageUrl || "https://storage.googleapis.com/your-menu-images-bucket/default.jpg",
              isActive: true,
              minimumQty: 5,
              currentQty: 50,
              menuStatus: "In Stock"
            };
          }
        }
      }
    }

    const reconstructedMenus = Object.values(uniqueMenus);
    console.log(`Successfully extracted ${reconstructedMenus.length} unique menu items from order history!`);

    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB for restoring menus...");

    const db = mongoose.connection.db;

    if (reconstructedMenus.length > 0) {
      // Clear current menus
      await db.collection("menus").deleteMany({});

      // Insert reconstructed menus
      await db.collection("menus").insertMany(reconstructedMenus);
      console.log(`Successfully restored ${reconstructedMenus.length} original menu items in database!`);
    } else {
      console.log("No menu items found to restore.");
    }

  } catch (err) {
    console.error("Failed to extract and restore menus:", err.message);
  } finally {
    process.exit(0);
  }
};

extractMenus();
