const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const compression = require("compression");
const connectDB = require("./config/db"); // Import db.js
const authRoute = require("./routes/authRoute");
const path = require("path");
const app = express();

const sharp = require("sharp");
// Optimize Sharp for low-memory container environments (Render 512MB RAM)
sharp.cache(false);
sharp.concurrency(1);

// 🚀 Enable Gzip/Deflate compression for fast network payload transfer
app.use(compression());

// Serve static uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

dotenv.config();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://swetha-cafe-restaurant.onrender.com",
  "https://a-a-roasted-chicken.onrender.com",
  "https://demo-restaurant-v6g2.onrender.com",
  /\.onrender\.com$/,        // any Render preview / service
  /\.netlify\.app$/,         // any Netlify subdomain
  /\.netlify\.live$/,        // Netlify live previews
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman, etc.)
    if (!origin) return callback(null, true);
    const allowed = allowedOrigins.some(o =>
      typeof o === "string" ? o === origin : o.test(origin)
    );
    if (allowed) return callback(null, true);
    callback(new Error("Not allowed by CORS: " + origin));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Connect to DB
connectDB();

app.use("/api/auth", authRoute);

// Root route for Render health and browser verification
app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Swetha Cafe & Restaurant RMS Backend API is running.",
    health: "/api/health"
  });
});

// Health & Memory check
app.get('/api/health', (req, res) => {
    const memory = process.memoryUsage();
    res.status(200).json({
        status: 'OK',
        message: 'Server is running',
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsageMB: {
            rss: (memory.rss / 1024 / 1024).toFixed(2),
            heapTotal: (memory.heapTotal / 1024 / 1024).toFixed(2),
            heapUsed: (memory.heapUsed / 1024 / 1024).toFixed(2),
            external: (memory.external / 1024 / 1024).toFixed(2)
        }
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));