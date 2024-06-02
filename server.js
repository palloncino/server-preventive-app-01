import dotenv from "dotenv";
const envPath =
  process.env.NODE_ENV === "production" ? ".env.remote" : ".env.local";
dotenv.config({ path: envPath });

import cors from "cors";
import express from "express";
import helmet from "helmet"; // Import helmet
import xssClean from "xss-clean"; // Import xss-clean
import rateLimit from "express-rate-limit"; // Import express-rate-limit
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import clientsRoutes from "./routes/clientsRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import quotesRoutes from "./routes/quotesRoutes.js";
import usersRoutes from "./routes/usersRoutes.js";
import testingRoutes from "./routes/testingRoutes.js";
import Logger from "./utils/Logger.js";
import "./utils/emailScheduler.js";

const app = express();
const PORT = process.env.PORT || 5004;

// Middleware
app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(helmet()); // Use helmet for security headers
app.use(xssClean()); // Use xss-clean for input sanitization

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
max: process.env.RATE_LIMIT_REQUEST,
});
app.use(limiter); // Apply rate limiting middleware to all requests

// Connect to database
connectDB();

// General request logging
app.use((req, res, next) => {
  res.on("finish", () => {
    Logger.info(`${req.method} ${req.originalUrl} ${res.statusCode}`);
  });
  next();
});

// Error handling middleware for JSON SyntaxError
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    Logger.error(`JSON Syntax Error: ${err.message}`);
    return res
      .status(400)
      .send({ message: "Bad request. Please check your JSON format." });
  }
  next(err);
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/quotes", quotesRoutes);
app.use("/api/docs", documentRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api/test", testingRoutes);

// Optional: 404 handler
app.use((req, res) => {
  Logger.warn(`404 - Not Found: ${req.originalUrl}`);
  res.status(404).send({ message: "Resource not found" });
});

// Start the server
app.listen(PORT, "0.0.0.0", () => {
  Logger.info(`Server running on http://0.0.0.0:${PORT}`);
});
