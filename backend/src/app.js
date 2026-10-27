import express from "express";
import cors from "cors";
import ApiError from "./utils/ApiError.js";
import cookieParser from "cookie-parser";

import apiRouter from "./routes/index.js";

const app = express();

// Enable Cross-Origin Resource Sharing
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  ...(process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",").map((s) => s.trim().replace(/\/$/, ""))
    : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        (process.env.NODE_ENV !== "production" && origin.includes("localhost"));

      if (isAllowed) {
        callback(null, true);
      } else {
        // Allow dynamic origin reflection so cross-origin Vercel previews don't break
        callback(null, true);
      }
    },
    credentials: true,
  }),
);

// Body & Cookie parsers (increased payload limit for rich weekly menus with images)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// Root route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Tiffin Service Management System API",
    version: "1.0.0",
  });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "HEALTHY",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Mount API routes
app.use("/api", apiRouter);

// 404 Handler for undefined routes
app.use((req, res, next) => {
  next(new ApiError(404, `Cannot find ${req.originalUrl} on this server`));
});

// Centralized Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === "production";

  res.status(statusCode).json({
    success: false,
    statusCode,
    message:
      isProduction && statusCode === 500
        ? "Internal Server Error"
        : err.message || "Internal Server Error",
    ...(!isProduction && { stack: err.stack }),
  });
});

export default app;
