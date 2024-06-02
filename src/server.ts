import dotenv from "dotenv";
const envPath =
  process.env.NODE_ENV === "production" ? ".env.remote" : ".env.local";
dotenv.config({ path: envPath });

import cors from "cors";
import express from "express";
import helmet from "helmet";
import xssClean from "xss-clean";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/db";
import authRoutes from "./routes/authRoutes";
import clientsRoutes from "./routes/clientsRoutes";
import documentRoutes from "./routes/documentRoutes";
import productRoutes from "./routes/productRoutes";
import quotesRoutes from "./routes/quotesRoutes";
import usersRoutes from "./routes/usersRoutes";
import testingRoutes from "./routes/testingRoutes";
import Logger from "./utils/Logger";
import "./utils/emailScheduler";

const app = express();
const PORT = process.env.PORT || 5004;

// Middleware
app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(helmet());
app.use(xssClean());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_REQUEST),
});
app.use(limiter);

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
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
      Logger.error(`JSON Syntax Error: ${err.message}`);
      return res
        .status(400)
        .send({ message: "Bad request. Please check your JSON format." });
    }
    next(err);
  }
);

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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

export default app;
