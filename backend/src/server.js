import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import mongoose from "mongoose";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
import { auditLogger } from "./middleware/auditLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { suspiciousPayloadDetector } from "./middleware/suspiciousPayload.js";
import authRoutes from "./routes/authRoutes.js";
import digiRoutes from "./routes/digilockerRoutes.js";
import voteRoutes from "./routes/voteRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import securityRoutes from "./routes/securityRoutes.js";

dotenv.config();

import { Server } from "socket.io";
import http from "http";
import { setupDatabaseWatcher } from "./utils/dbWatcher.js"; // Added import

const app = express();
const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // Changed to FRONTEND_URL, removed methods
    credentials: true,
  },
});

// Attach io to req for routes to use
app.use((req, res, next) => {
  req.io = io;
  next();
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id); // Changed log message
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id); // Changed log message
  });
});

// Basic security + parsing
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // Changed to FRONTEND_URL
    credentials: true,
  })
);
app.use(express.json()); // Removed limit
// Detect potential SQL/NoSQL injection patterns before sanitization
app.use(suspiciousPayloadDetector);
app.use(cookieParser(process.env.COOKIE_SECRET || "votesetu-secret"));
app.use(mongoSanitize());
app.use(xss());

// Per-request basic context
app.use(auditLogger);

// Logging
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Health & basic routes
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "VoteSetu Backend",
    time: new Date().toISOString(),
  });
});

// Core APIs
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/votes", voteRoutes);
app.use("/api/digilocker", digiRoutes);
app.use("/api/security", securityRoutes);

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

async function start() {
  await connectDB();

  // Setup database tampering detection after DB connection
  setupDatabaseWatcher(io);

  server.listen(PORT, () => {
    console.log(`🚀 VoteSetu backend listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Fatal startup error", err);
  process.exit(1);
});
