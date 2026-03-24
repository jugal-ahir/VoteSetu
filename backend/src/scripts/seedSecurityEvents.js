import mongoose from "mongoose";
import dotenv from "dotenv";
import { AuditLog } from "../models/AuditLog.js";
import { User } from "../models/User.js";
import { connectDB } from "../config/db.js";

dotenv.config();

// Static high-fidelity geographic data for a stable demo
const GEO_DATA = {
  AHMEDABAD: { city: "Ahmedabad", country: "India", coordinates: { lat: 23.0225, lng: 72.5714 } },
  LONDON: { city: "London", country: "United Kingdom", coordinates: { lat: 51.5074, lng: -0.1278 } },
  NYC: { city: "New York", country: "United States", coordinates: { lat: 40.7128, lng: -74.0060 } },
  TOKYO: { city: "Tokyo", country: "Japan", coordinates: { lat: 35.6762, lng: 139.6503 } },
  SYDNEY: { city: "Sydney", country: "Australia", coordinates: { lat: -33.8688, lng: 151.2093 } },
  MOSCOW: { city: "Moscow", country: "Russia", coordinates: { lat: 55.7558, lng: 37.6173 } },
};

const ACTIONS = [
  { action: "LOGIN_SUCCESS", risk: "LOW", status: "INFO" },
  { action: "LOGIN_FAILED", risk: "MEDIUM", status: "WARNED" },
  { action: "PAYLOAD_SUSPICIOUS", risk: "HIGH", status: "WARNED" },
];

async function seed() {
  await connectDB();
  await AuditLog.deleteMany({});
  
  const users = await User.find().limit(5);
  if (users.length === 0) {
    console.error("No users found to seed events for!");
    process.exit(1);
  }

  const events = [];

  // 1. IMPOSSIBLE TRAVEL CASE (London -> NYC in 2 mins)
  const user1 = users[1] || users[0];
  const baseTime = new Date(Date.now() - 10 * 60 * 1000);
  
  // Point A: London
  events.push({
    userId: user1._id,
    userRole: user1.role,
    action: "LOGIN_SUCCESS",
    ip: "25.0.0.1",
    location: GEO_DATA.LONDON,
    risk: "LOW",
    status: "INFO",
    createdAt: baseTime
  });

  // Point B: NYC (2 mins later)
  const dist = 5570; 
  const speed = dist / (2 / 60); // 167,000 km/h
  
  events.push({
    userId: user1._id,
    userRole: user1.role,
    action: "LOGIN_SUCCESS",
    ip: "69.162.80.54",
    location: GEO_DATA.NYC,
    risk: "CRITICAL",
    status: "BLOCKED",
    details: { anomaly: "IMPOSSIBLE_TRAVEL_DETECTED", speed: `${Math.round(speed)} km/h` },
    travelMetrics: {
      isImpossible: true,
      speedKmh: Math.round(speed),
      distanceKm: dist,
      prevLocation: { city: "London", country: "United Kingdom" }
    },
    createdAt: new Date(Date.now() - 8 * 60 * 1000)
  });

  // 2. Random background noise
  const geoKeys = Object.keys(GEO_DATA);
  for (let i = 0; i < 40; i++) {
    const geo = GEO_DATA[geoKeys[Math.floor(Math.random() * geoKeys.length)]];
    const user = users[Math.floor(Math.random() * users.length)];
    const act = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];

    events.push({
      userId: user._id,
      userRole: user.role,
      action: act.action,
      ip: `192.168.1.${Math.floor(Math.random() * 254)}`,
      location: geo,
      risk: act.risk,
      status: act.status,
      createdAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000)
    });
  }

  await AuditLog.insertMany(events);
  console.log(`✅ Seeded ${events.length} events with STABLE SYNTHETIC coordinates.`);
  process.exit(0);
}

seed().catch(console.error);
