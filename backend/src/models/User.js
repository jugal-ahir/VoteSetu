import mongoose from "mongoose";

const otpSubSchema = new mongoose.Schema(
  {
    otpHash: String,
    expiresAt: Date,
    attempts: { type: Number, default: 0 },
    lockedUntil: Date,
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    voterId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["voter", "admin"], default: "voter" },

    loginAttempts: { type: Number, default: 0 },
    lockedUntil: Date,

    otp: otpSubSchema,

    votedElections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Election",
      },
    ],

    digilockerStatus: {
      type: String,
      enum: ["PENDING", "VERIFIED", "FAILED"],
      default: "PENDING",
    },
    digilockerVerificationId: String,
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);


