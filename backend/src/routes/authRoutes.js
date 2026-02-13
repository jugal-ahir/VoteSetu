import express from "express";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { DigiLockerCitizen } from "../models/DigiLockerCitizen.js";
import { DigiLockerVerification } from "../models/DigiLockerVerification.js";
import { signAccessToken } from "../utils/jwt.js";
import { logSecurityEvent } from "../middleware/auditLogger.js";
import { sha256 } from "../utils/crypto.js";
import { v4 as uuidv4 } from "uuid";
import { authorizeDocument, preAuthorizeId } from "../utils/dbWatcher.js";

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register/pre-check", async (req, res, next) => {
  try {
    const { email, voterId } = req.body;
    const existing = await User.findOne({
      $or: [{ email }, { voterId }],
    }).lean();
    if (existing) {
      return res.status(409).json({
        status: "error",
        message: "Email or Voter ID already registered",
      });
    }
    res.json({ status: "ok" });
  } catch (err) {
    next(err);
  }
});

router.post("/register/verify-aadhar", async (req, res, next) => {
  try {
    const { aadhaarId, name } = req.body;
    if (!aadhaarId || !name) {
      return res
        .status(400)
        .json({ status: "error", message: "Missing Aadhaar ID or Name" });
    }

    const citizen = await DigiLockerCitizen.findOne({ aadhaarId });
    if (!citizen) {
      return res.status(404).json({
        status: "error",
        message: "Aadhaar number not found in DigiLocker records.",
      });
    }

    const normalize = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, " ");
    if (normalize(name) !== normalize(citizen.name)) {
      return res.status(400).json({
        status: "error",
        message: "Name does not match DigiLocker record for this Aadhaar.",
      });
    }

    // Simulated OTP send
    console.log(`Simulated Registration OTP for Aadhaar ${aadhaarId}: 123456`);
    res.json({ status: "ok", message: "OTP sent to your Aadhar-linked mobile number." });
  } catch (err) {
    next(err);
  }
});

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, voterId, password, aadhaarId, otp } = req.body;
    if (!name || !email || !voterId || !password || !aadhaarId || !otp) {
      return res
        .status(400)
        .json({ status: "error", message: "Missing required fields" });
    }

    // Verify OTP (Fixed for demo)
    if (otp !== "123456") {
      return res.status(401).json({ status: "error", message: "Invalid OTP" });
    }

    const existing = await User.findOne({
      $or: [{ email }, { voterId }],
    }).lean();
    if (existing) {
      return res.status(409).json({
        status: "error",
        message: "Email or Voter ID already registered",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Create DigiLocker Verification record
    const verificationId = `REG-DLK-${uuidv4().slice(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000).toString()}`;
    const maskedAadhaar = aadhaarId.replace(/^(\d{4})\d{4}(\d{4})$/, "$1XXXX$2");

    const _id = new mongoose.Types.ObjectId();
    preAuthorizeId("users", _id);

    const user = await User.create({
      _id,
      name,
      email,
      voterId,
      passwordHash,
      role: "voter",
      digilockerStatus: "VERIFIED",
      digilockerVerificationId: verificationId
    });

    // Authorize new user
    await authorizeDocument("users", user._id);

    await DigiLockerVerification.create({
      user: user._id,
      aadhaarMasked: maskedAadhaar,
      document: "AADHAAR",
      status: "VERIFIED",
      verificationId,
      verificationToken: sha256(`${user._id}|${aadhaarId}|${Date.now()}`),
    });

    logSecurityEvent({
      req,
      action: "USER_REGISTERED_WITH_AADHAR",
      risk: "LOW",
      status: "INFO",
      details: { voterId: user.voterId, verificationId },
    });

    res.status(201).json({
      status: "ok",
      message: "Registered and verified successfully. Please login.",
    });
  } catch (err) {
    next(err);
  }
});

router.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const { voterId, password } = req.body;
    if (!voterId || !password) {
      return res
        .status(400)
        .json({ status: "error", message: "Missing credentials" });
    }

    const identifier = String(voterId).trim();
    // Allow login by either Voter ID or Email using the same input field
    const user = await User.findOne({
      $or: [{ voterId: identifier }, { email: identifier.toLowerCase() }],
    });
    if (!user) {
      await logSecurityEvent({
        req,
        action: "LOGIN_FAILED",
        risk: "LOW",
        status: "WARNED",
        details: { voterId },
      });
      return res
        .status(401)
        .json({ status: "error", message: "Invalid credentials" });
    }

    const now = new Date();
    if (user.lockedUntil && user.lockedUntil > now) {
      await logSecurityEvent({
        req,
        action: "LOGIN_LOCKED",
        risk: "MEDIUM",
        status: "BLOCKED",
        details: { voterId },
      });
      return res.status(423).json({
        status: "error",
        message: "Account temporarily locked due to repeated failures",
      });
    }

    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await user.save();
      await authorizeDocument("users", user._id);

      await logSecurityEvent({
        req,
        action: "LOGIN_FAILED",
        risk: user.loginAttempts >= 5 ? "HIGH" : "LOW",
        status: user.loginAttempts >= 5 ? "BLOCKED" : "WARNED",
        details: { voterId, attempts: user.loginAttempts },
      });

      return res
        .status(401)
        .json({ status: "error", message: "Invalid credentials" });
    }

    // Reset attempts
    user.loginAttempts = 0;
    user.lockedUntil = undefined;

    // Generate OTP (simulated email)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    user.otp = {
      otpHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attempts: 0,
      lockedUntil: undefined,
    };
    await user.save();
    await authorizeDocument("users", user._id);

    // In real system send via email/SMS provider. Here we log to console.
    console.log(`Simulated OTP for voterId=${user.voterId}: ${otp}`);

    await logSecurityEvent({
      req,
      action: "LOGIN_PASSWORD_OK_OTP_SENT",
      risk: "LOW",
      status: "INFO",
      details: { voterId: user.voterId },
    });

    res.json({
      status: "ok",
      message:
        "Password verified. OTP has been sent via simulated email for demo.",
    });
  } catch (err) {
    next(err);
  }
});

router.post("/verify-otp", otpLimiter, async (req, res, next) => {
  try {
    const { voterId, otp } = req.body;
    if (!voterId || !otp) {
      return res
        .status(400)
        .json({ status: "error", message: "Missing voterId or OTP" });
    }

    const user = await User.findOne({ voterId });
    if (!user || !user.otp) {
      await logSecurityEvent({
        req,
        action: "OTP_FAILED",
        risk: "MEDIUM",
        status: "WARNED",
        details: { voterId },
      });
      return res
        .status(401)
        .json({ status: "error", message: "Invalid OTP" });
    }

    const now = new Date();
    if (user.otp.lockedUntil && user.otp.lockedUntil > now) {
      await logSecurityEvent({
        req,
        action: "OTP_BRUTE_FORCE_BLOCKED",
        risk: "HIGH",
        status: "BLOCKED",
        details: { voterId },
      });
      return res.status(423).json({
        status: "error",
        message: "OTP temporarily locked due to repeated failures",
      });
    }

    if (user.otp.expiresAt < now) {
      await logSecurityEvent({
        req,
        action: "OTP_EXPIRED",
        risk: "LOW",
        status: "WARNED",
        details: { voterId },
      });
      return res
        .status(401)
        .json({ status: "error", message: "OTP expired, please login again" });
    }

    const otpOk = await bcrypt.compare(otp, user.otp.otpHash);
    if (!otpOk) {
      user.otp.attempts += 1;
      if (user.otp.attempts >= 5) {
        user.otp.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await user.save();
      await authorizeDocument("users", user._id);

      await logSecurityEvent({
        req,
        action: "OTP_FAILED",
        risk: user.otp.attempts >= 5 ? "HIGH" : "MEDIUM",
        status: user.otp.attempts >= 5 ? "BLOCKED" : "WARNED",
        details: { voterId, attempts: user.otp.attempts },
      });

      return res
        .status(401)
        .json({ status: "error", message: "Invalid OTP" });
    }

    // OTP ok -> issue JWT
    user.otp = undefined;
    await user.save();
    await authorizeDocument("users", user._id);

    const token = signAccessToken({
      sub: user._id.toString(),
      role: user.role,
      voterId: user.voterId,
    });

    await logSecurityEvent({
      req,
      action: "LOGIN_SUCCESS",
      risk: "LOW",
      status: "INFO",
      details: { voterId: user.voterId },
    });

    // Set secure-ish cookie (for demo)
    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 60 * 1000,
    });

    res.json({
      status: "ok",
      token,
      user: {
        id: user._id,
        name: user.name,
        voterId: user.voterId,
        role: user.role,
        digilockerStatus: user.digilockerStatus,
        votedElections: user.votedElections,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;


