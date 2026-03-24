import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    ip: { type: String, index: true },
    action: { type: String, required: true, index: true },
    risk: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "LOW",
    },
    status: {
      type: String,
      enum: ["INFO", "WARNED", "BLOCKED"],
      default: "INFO",
    },
    details: { type: Object },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userRole: { type: String },
    userAgent: { type: String },
    browser: { type: String },
    os: { type: String },
    device: { type: String },
    location: {
      city: { type: String },
      country: { type: String },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    travelMetrics: {
      isImpossible: { type: Boolean, default: false },
      speedKmh: { type: Number },
      distanceKm: { type: Number },
      prevLocation: {
        city: { type: String },
        country: { type: String }
      }
    }
  },
  { timestamps: true }
);

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);


