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
  },
  { timestamps: true }
);

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);


