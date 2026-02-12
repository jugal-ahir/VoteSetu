import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
import { auditLogger } from "./middleware/auditLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { suspiciousPayloadDetector } from "./middleware/suspiciousPayload.js";
import authRoutes from "./routes/authRoutes.js";
import digiRoutes from "./routes/digilockerRoutes.js";
import voteRoutes from "./routes/voteRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

dotenv.config();

const app = express();

// Basic security + parsing
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10kb" }));
// Detect potential SQL/NoSQL injection patterns before sanitization
app.use(suspiciousPayloadDetector);
app.use(cookieParser());
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
app.use("/api/digilocker", digiRoutes);
app.use("/api/votes", voteRoutes);
app.use("/api/admin", adminRoutes);

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`VoteSetu backend listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Fatal startup error", err);
  process.exit(1);
});


