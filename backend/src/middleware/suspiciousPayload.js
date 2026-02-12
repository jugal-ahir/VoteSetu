import { logSecurityEvent } from "./auditLogger.js";

const SQL_PATTERNS = [
  " or 1=1",
  " or '1'='1",
  "--",
  "/*",
  "*/",
  " union ",
  " select ",
];

function inspectValue(val) {
  if (typeof val !== "string") return false;
  const lower = val.toLowerCase();
  if (lower.includes("$where") || lower.includes("{$")) return true;
  return SQL_PATTERNS.some((p) => lower.includes(p));
}

export function suspiciousPayloadDetector(req, res, next) {
  try {
    let suspicious = false;

    const scan = (obj) => {
      if (!obj || typeof obj !== "object") return;
      for (const [k, v] of Object.entries(obj)) {
        if (k.startsWith("$")) {
          suspicious = true;
          continue;
        }
        if (inspectValue(v)) suspicious = true;
        if (typeof v === "object") scan(v);
      }
    };

    scan(req.body);
    scan(req.query);

    if (suspicious) {
      logSecurityEvent({
        req,
        action: "PAYLOAD_SUSPICIOUS",
        risk: "HIGH",
        status: "WARNED",
        details: { path: req.originalUrl },
      });
    }
  } catch (err) {
    console.error("Suspicious detector error:", err.message);
  }

  next();
}


