import { verifyAccessToken } from "../utils/jwt.js";
import { logSecurityEvent } from "./auditLogger.js";

export function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token =
      (authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null) || req.cookies?.accessToken;

    if (!token) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const decoded = verifyAccessToken(token);
    req.user = {
      _id: decoded.sub,
      role: decoded.role,
      voterId: decoded.voterId,
    };
    next();
  } catch (err) {
    logSecurityEvent({
      req,
      action: "TOKEN_INVALID",
      risk: "MEDIUM",
      status: "WARNED",
      details: { reason: err.message },
    });
    return res
      .status(401)
      .json({ status: "error", message: "Invalid or expired token" });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res
        .status(403)
        .json({ status: "error", message: "Insufficient permissions" });
    }
    next();
  };
}


