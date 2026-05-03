/**
 * Garmin Workouts Backend
 * Proxy server for Garmin Connect API and OpenAI integration
 */

import dotenv from "dotenv";
dotenv.config();

import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import { garminRoutes } from "./routes/garmin";
import { aiRoutes } from "./routes/ai";
import { errorHandler } from "./middleware/errorHandler";
import { assertProductionSecrets } from "./config/env";

assertProductionSecrets();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Trust proxy - required for express-rate-limit behind reverse proxies (Fly.io, etc.)
app.set("trust proxy", 1);

// Middleware
app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || [
      "http://localhost:19000",
      "http://localhost:8081",
    ],
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/garmin", garminRoutes);
app.use("/api/ai", aiRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || "development"}`);
});
