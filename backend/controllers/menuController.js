// backend/controllers/menuController.js
const Menu = require("../models/Menu");
const path = require("path");
const axios = require("axios");
const sharp = require("sharp");

// Helper to convert any external image URL to permanent base64 webp in MongoDB
async function convertUrlToBase64(url) {
  if (!url || typeof url !== "string") return null;
  if (url.startsWith("data:image/")) return url;
  if (!url.startsWith("http://") && !url.startsWith("https://")) return null;

  try {
    const res = await axios.get(url, { responseType: "arraybuffer", timeout: 8000 });
    const buffer = await sharp(res.data)
      .resize(400, 400, { fit: "cover" })
      .toFormat("webp", { quality: 75 })
      .toBuffer();
    return `data:image/webp;base64,${buffer.toString("base64")}`;
  } catch (err) {
    console.warn("Could not download external image URL:", url.substring(0, 60), err.message);
    return url;
  }
}

// Helper function to safely parse numbers
function parseNumber(value) {
  const num = parseFloat(value);
  return isNaN(num) ? undefined : num;
}

// GET /menus - Get all menus
exports.getMenus = async (req, res) => {
  try {
    const menus = await Menu.find({})
      .sort({ createdAt: -1 })
      .lean();
    res.json(menus);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch menus" });
  }
};

// GET /menu/:id - Get single menu WITH imageUrl (for edit forms)
exports.getMenuById = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id).lean();
    if (!menu) return res.status(404).json({ error: "Menu not found" });
    res.json(menu);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch menu item" });
  }
};

// POST /api/auth/menu
exports.createMenu = async (req, res) => {
  const formData = req.body;
  const providedImageUrl = formData.imageUrl?.trim();

  try {
    let imageUrl = "https://storage.googleapis.com/your-menu-images-bucket/default.jpg";

    if (req.fileUrl) {
      imageUrl = req.fileUrl; // From uploadMiddleware (Multer + Sharp compressed local file)
    } else if (providedImageUrl) {
      const permanentImg = await convertUrlToBase64(providedImageUrl);
      imageUrl = permanentImg || providedImageUrl;
    }

    const price = parseNumber(formData.price) || 0;
    const cost = parseNumber(formData.cost) || 0;
    const minimumQty = formData.minimumQty ? parseInt(formData.minimumQty) : 5;
    const currentQty = formData.currentQty ? parseInt(formData.currentQty) : minimumQty;

    const newMenu = new Menu({
      ...formData,
      price,
      cost,
      minimumQty,
      currentQty,
      netProfit: price - cost,
      imageUrl
    });

    await newMenu.save();
    console.log("💾 Menu item saved to database:", newMenu.name, "Image:", imageUrl);
    res.json(newMenu);
  } catch (err) {
    console.error("Creation failed:", err.message);
    res.status(500).json({ error: err.message || "Failed to create menu item" });
  }
};

// PUT /menu/:id - Update menu
exports.updateMenu = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const providedImageUrl = updates.imageUrl?.trim();

  const name = updates.name;
  const description = updates.description;
  const price = parseNumber(updates.price);
  const cost = parseNumber(updates.cost);
  const minimumQty = updates.minimumQty ? parseInt(updates.minimumQty) : undefined;
  const currentQty = updates.currentQty ? parseInt(updates.currentQty) : undefined;

  if (
    (updates.price && isNaN(price)) ||
    (updates.cost && isNaN(cost)) ||
    (updates.minimumQty && isNaN(minimumQty)) ||
    (updates.currentQty && isNaN(currentQty)) 
  ) {
    return res.status(400).json({ error: "Price, Cost, and Quantity must be valid numbers" });
  }

  const updateFields = {};
  if (name !== undefined) updateFields.name = name;
  if (description !== undefined) updateFields.description = description;
  if (price !== undefined) updateFields.price = price;
  if (cost !== undefined) updateFields.cost = cost;
  if (minimumQty !== undefined) updateFields.minimumQty = minimumQty;
  if (currentQty !== undefined) updateFields.currentQty = currentQty;
  if (updates.category) updateFields.category = updates.category;

  if (price !== undefined || cost !== undefined) {
    const existingMenu = await Menu.findById(id);
    const finalPrice = price !== undefined ? price : existingMenu.price;
    const finalCost = cost !== undefined ? cost : existingMenu.cost;
    updateFields.netProfit = finalPrice - finalCost;
  }

  if (req.fileUrl) {
    updateFields.imageUrl = req.fileUrl; // From uploadMiddleware
  } else if (providedImageUrl) {
    const permanentImg = await convertUrlToBase64(providedImageUrl);
    updateFields.imageUrl = permanentImg || providedImageUrl;
  }

  try {
    const updated = await Menu.findByIdAndUpdate(id, { $set: updateFields }, {
      new: true,
      runValidators: true
    });

    if (!updated) {
      return res.status(404).json({ error: "Menu not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("Update failed:", err.message);
    res.status(500).json({ error: "Failed to update menu" });
  }
};

// POST /api/auth/menu/restock-all
exports.restockAllMenus = async (req, res) => {
  const { amount } = req.body;

  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: "Valid restock amount is required" });
  }

  const addQty = parseInt(amount, 10);

  try {
    // Update all menus: increase both currentQty and minimumQty by `amount`
    const result = await Menu.updateMany(
      {},
      [
        {
          $set: {
            currentQty: { $add: ["$currentQty", addQty] },
            minimumQty: { $add: ["$minimumQty", addQty] }
          }
        }
      ]
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "No menus found to restock" });
    }

    // Return updated menus
    const updatedMenus = await Menu.find();
    res.json(updatedMenus);
  } catch (err) {
    console.error("Bulk restock failed:", err);
    res.status(500).json({ error: "Failed to restock all items" });
  }
};

// DELETE /menu/:id - Delete menu
exports.deleteMenu = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Menu.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Menu not found" });
    }
    res.json({ message: "Menu deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete menu" });
  }
};