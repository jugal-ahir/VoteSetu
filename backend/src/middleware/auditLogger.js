import { AuditLog } from "../models/AuditLog.js";
import { getSimulatedLocation } from "../utils/geoSim.js";

function parseUA(ua) {
  if (!ua) return { browser: "Unknown", os: "Unknown", device: "Desktop" };
  const lower = ua.toLowerCase();
  let browser = "Other";
  if (lower.includes("chrome")) browser = "Chrome";
  else if (lower.includes("safari")) browser = "Safari";
  else if (lower.includes("firefox")) browser = "Firefox";
  else if (lower.includes("edge")) browser = "Edge";

  let os = "Other";
  if (lower.includes("windows")) os = "Windows";
  else if (lower.includes("mac")) os = "MacOS";
  else if (lower.includes("linux")) os = "Linux";
  else if (lower.includes("android")) os = "Android";
  else if (lower.includes("iphone") || lower.includes("ipad")) os = "iOS";

  let device = "Desktop";
  if (lower.includes("mobi")) device = "Mobile";
  if (lower.includes("tablet")) device = "Tablet";

  return { browser, os, device };
}

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
      req?.connection?.remoteAddress ||
      "127.0.0.1";

    const ua = req?.headers["user-agent"];
    const { browser, os, device } = parseUA(ua);
    let location = await getSimulatedLocation(sourceIp);

    // Override with high-accuracy GPS if provided by client
    const clientCoords = req?.headers["x-user-coords"];
    if (clientCoords) {
      try {
        const coords = JSON.parse(clientCoords);
        if (coords.lat && coords.lng) {
          location = {
            ...location,
            coordinates: { lat: coords.lat, lng: coords.lng },
            city: location.city === "New Delhi" ? "Current Location" : location.city // Better than hardcoded New Delhi
          };
        }
      } catch (e) {
        console.warn("Malformed GPS coordinates received");
      }
    }

    const userId = req?.user?._id || null;
    let travelMetrics = { isImpossible: false };

    // Detection Logic for Impossible Travel
    if (userId && location.coordinates && location.coordinates.lat) {
      const prevLog = await AuditLog.findOne({ 
        userId, 
        action: "LOGIN_SUCCESS",
        "location.coordinates.lat": { $exists: true }
      }).sort({ createdAt: -1 });

      if (prevLog && prevLog.location?.coordinates) {
        const lat1 = prevLog.location.coordinates.lat;
        const lon1 = prevLog.location.coordinates.lng;
        const lat2 = location.coordinates.lat;
        const lon2 = location.coordinates.lng;

        // Haversine Distance
        const R = 6371; 
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;

        const timeDiffHours = (Date.now() - new Date(prevLog.createdAt).getTime()) / (1000 * 60 * 60);
        const speed = timeDiffHours > 0 ? distance / timeDiffHours : 0;

        // Threshold: 1000 km/h (Commercial Airplane speed)
        if (distance > 50 && speed > 1000) {
          travelMetrics = {
            isImpossible: true,
            speedKmh: Math.round(speed),
            distanceKm: Math.round(distance),
            prevLocation: {
              city: prevLog.location.city,
              country: prevLog.location.country
            }
          };
          // Automatically escalate risk and status
          risk = "CRITICAL";
          status = "BLOCKED";
          details.anomaly = "IMPOSSIBLE_TRAVEL_DETECTED";
          details.speed = `${Math.round(speed)} km/h`;
          details.distance = `${Math.round(distance)} km`;
        }
      }
    }

    const log = await AuditLog.create({
      ip: sourceIp,
      action,
      risk,
      status,
      details,
      userId,
      userRole: req?.user?.role || null,
      userAgent: ua,
      browser,
      os,
      device,
      location,
      travelMetrics
    });

    // Broadcast log in real-time if io is available
    const { io } = await import("../server.js");
    if (io) {
      io.emit("security_alert", {
        ...log.toObject(),
        timestamp: log.createdAt
      });
    }
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



