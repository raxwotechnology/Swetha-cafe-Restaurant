// backend/middleware/uploadMiddleware.js
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../uploads/menu");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Memory storage for processing with sharp
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Middleware to resize, compress, and save image
const processMenuImage = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const filename = `menu_${Date.now()}_${Math.round(Math.random() * 1e9)}.webp`;
    const outputPath = path.join(uploadDir, filename);

    // Compress & resize image to max 400x400 lightweight webp
    const buffer = await sharp(req.file.buffer)
      .resize(400, 400, { fit: "cover" })
      .toFormat("webp", { quality: 75 })
      .toBuffer();

    // Optionally save to local disk
    try {
      fs.writeFileSync(outputPath, buffer);
    } catch (fsErr) {
      console.warn("Could not save image to local disk:", fsErr.message);
    }

    // Convert compressed webp to Data URI for 100% MongoDB persistence
    const base64Image = buffer.toString("base64");
    req.fileUrl = `data:image/webp;base64,${base64Image}`;

    next();
  } catch (err) {
    console.error("Error processing menu image:", err);
    return res.status(500).json({ error: "Failed to process image upload" });
  }
};

module.exports = {
  uploadSingle: upload.single("image"),
  processMenuImage
};