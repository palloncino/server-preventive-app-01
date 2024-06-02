import cors from "cors";
import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { connectDB } from "./config/db";
import authRoutes from "./routes/auth-routes";
import usersRoutes from "./routes/users-routes";
import Logger from "./utils/Logger";

const envPath =
  process.env.NODE_ENV === "production" ? ".env.remote" : ".env.local";
dotenv.config({ path: envPath });

const app = express();
const PORT = Number(process.env.PORT) || 5004;

// Middleware
app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(helmet());

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
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && "body" in err) {
    Logger.error(`JSON Syntax Error: ${err.message}`);
    return res
      .status(400)
      .send({ message: "Bad request. Please check your JSON format." });
  }
  next(err);
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);

// Optional: 404 handler
app.use((req, res) => {
  Logger.warn(`404 - Not Found: ${req.originalUrl}`);
  res.status(404).send({ message: "Resource not found" });
});

app.listen(PORT, "0.0.0.0", () => {
  Logger.info(`Server running on http://0.0.0.0:${PORT}`);
});

export default app;
