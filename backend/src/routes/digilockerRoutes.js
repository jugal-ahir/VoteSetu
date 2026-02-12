import express from "express";
import { v4 as uuidv4 } from "uuid";
import { requireAuth } from "../middleware/auth.js";
import { DigiLockerVerification } from "../models/DigiLockerVerification.js";
import { DigiLockerCitizen } from "../models/DigiLockerCitizen.js";
import { User } from "../models/User.js";
import { logSecurityEvent } from "../middleware/auditLogger.js";
import { sha256 } from "../utils/crypto.js";
import { generateOtp, storeOtp, verifyOtp } from "../utils/otpStore.js";

const router = express.Router();

// Request OTP for DigiLocker Verification
router.post("/request-otp", requireAuth, async (req, res, next) => {
  try {
    const { aadhaarId } = req.body;

    if (!aadhaarId || !/^\d{12}$/.test(aadhaarId)) {
      return res.status(400).json({ status: "error", message: "Invalid Aadhaar ID" });
    }

    // Check if citizen exists
    const citizen = await DigiLockerCitizen.findOne({ aadhaarId });
    if (!citizen) {
      return res.status(404).json({ status: "error", message: "Aadhaar not found in mock database." });
    }

    // Generate & Store OTP
    const otp = generateOtp();
    storeOtp(aadhaarId, otp); // Store tied to Aadhaar

    console.log(`[SECURE LOG] DigiLocker Verification OTP for ${aadhaarId}: ${otp}`);

    logSecurityEvent({
      req,
      action: "DIGILOCKER_OTP_REQUESTED",
      risk: "LOW",
      status: "INFO",
      details: { aadhaarId }
    });

    res.json({ status: "ok", message: "OTP sent to Aadhaar-linked mobile." });
  } catch (err) {
    next(err);
  }
});

// Simulated DigiLocker verification endpoint
router.post("/verify", requireAuth, async (req, res, next) => {
  try {
    const { aadhaarId, otp, consent, documentHash } = req.body;

    if (!aadhaarId || !otp || !consent) {
      return res
        .status(400)
        .json({ status: "error", message: "Missing required fields" });
    }

    if (!/^\d{12}$/.test(aadhaarId)) {
      await logSecurityEvent({
        req,
        action: "DIGILOCKER_ID_INVALID",
        risk: "LOW",
        status: "WARNED",
      });
      return res
        .status(400)
        .json({ status: "error", message: "Invalid Aadhaar-like ID format" });
    }

    // Verify OTP
    const isValidOtp = verifyOtp(aadhaarId, otp);
    if (!isValidOtp) {
      await logSecurityEvent({
        req,
        action: "DIGILOCKER_OTP_FAILED",
        risk: "MEDIUM",
        status: "WARNED",
        details: { aadhaarId },
      });
      return res.status(401).json({ status: "error", message: "Invalid or expired DigiLocker OTP" });
    }

    // Check that Aadhaar exists in our mock DigiLocker DB and that
    // the registered name matches the DigiLocker record.
    const citizen = await DigiLockerCitizen.findOne({ aadhaarId });
    const normalize = (s) =>
      String(s || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

    if (!citizen) {
      // Should have been caught in request-otp, but double check
      return res.status(404).json({
        status: "error",
        message: "Aadhaar number not found in DigiLocker records.",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }

    if (normalize(user.name) !== normalize(citizen.name)) {
      await logSecurityEvent({
        req,
        action: "DIGILOCKER_NAME_MISMATCH",
        risk: "MEDIUM",
        status: "WARNED",
        details: { aadhaarId },
      });
      return res.status(400).json({
        status: "error",
        message: "Name does not match DigiLocker record for this Aadhaar.",
      });
    }

    if (documentHash && !/^[a-f0-9]{64}$/i.test(documentHash)) {
      await logSecurityEvent({
        req,
        action: "DIGILOCKER_DOC_HASH_INVALID",
        risk: "LOW",
        status: "WARNED",
      });
      return res.status(400).json({
        status: "error",
        message: "Document hash must be a SHA-256 hex string",
      });
    }

    const verificationId = `DLK-${uuidv4().slice(0, 4).toUpperCase()}-${Math
      .floor(1000 + Math.random() * 9000)
      .toString()}`;

    const tokenPayload = `${user._id.toString()}|${aadhaarId}|${Date.now()}`;
    const verificationToken = sha256(tokenPayload);

    const maskedAadhaar = aadhaarId.replace(/^(\d{4})\d{4}(\d{4})$/, "$1XXXX$2");

    await DigiLockerVerification.create({
      user: user._id,
      aadhaarMasked: maskedAadhaar,
      document: "AADHAAR",
      status: "VERIFIED",
      verificationId,
      verificationToken,
    });

    user.digilockerStatus = "VERIFIED";
    user.digilockerVerificationId = verificationId;
    await user.save();

    await logSecurityEvent({
      req,
      action: "DIGILOCKER_VERIFIED",
      risk: "LOW",
      status: "INFO",
      details: { verificationId },
    });

    res.json({
      status: "VERIFIED",
      document: "AADHAAR",
      verificationId,
      verificationToken,
      disclaimer:
        "This is a simulated DigiLocker verification for academic use only.",
    });
  } catch (err) {
    next(err);
  }
});

export default router;


