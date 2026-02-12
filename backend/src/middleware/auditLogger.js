import { AuditLog } from "../models/AuditLog.js";

// Helper to create an audit log entry from anywhere in the codebase
export async function logSecurityEvent({
  req,
  ip,
  action,
  risk = "LOW",
  status = "INFO",
  details = {},
}) {
  try {
    const sourceIp =
      ip ||
      req?.ip ||
      req?.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req?.connection?.remoteAddress;

    await AuditLog.create({
      ip: sourceIp,
      action,
      risk,
      status,
      details,
      userId: req?.user?._id || null,
      userRole: req?.user?.role || null,
    });
  } catch (err) {
    // Do not crash the app on logging failures
    console.error("Audit log error:", err.message);
  }
}

// Thin middleware that can be placed early to tag each request with a start time
export function auditLogger(req, res, next) {
  req._startTime = Date.now();
  next();
}



