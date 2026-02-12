import mongoose from "mongoose";

const digiSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    aadhaarMasked: String,
    document: { type: String, default: "AADHAAR" },
    status: {
      type: String,
      enum: ["PENDING", "VERIFIED", "FAILED"],
      default: "PENDING",
    },
    verificationId: { type: String, required: true, unique: true },
    verificationToken: { type: String, required: true },
  },
  { timestamps: true }
);

export const DigiLockerVerification = mongoose.model(
  "DigiLockerVerification",
  digiSchema
);


