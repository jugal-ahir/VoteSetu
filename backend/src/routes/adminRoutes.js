import express from "express";
import mongoose from "mongoose";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { Election } from "../models/Election.js";
import { Candidate } from "../models/Candidate.js";
import { Vote } from "../models/Vote.js";
import { AuditLog } from "../models/AuditLog.js";

const router = express.Router();

// All admin routes require admin role
router.use(requireAuth, requireRole("admin"));

// Create a new election (initially DRAFT)
router.post("/elections", async (req, res, next) => {
  try {
    const { name, description, startsAt, endsAt } = req.body;
    if (!name) {
      return res
        .status(400)
        .json({ status: "error", message: "Name is required" });
    }

    const election = await Election.create({
      name,
      description,
      startsAt,
      endsAt,
      status: "DRAFT",
    });

    res.status(201).json({ status: "ok", election });
  } catch (err) {
    next(err);
  }
});

// Update election status: DRAFT -> ACTIVE -> CLOSED
router.patch("/elections/:id/status", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["DRAFT", "ACTIVE", "CLOSED"].includes(status)) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid status" });
    }

    const election = await Election.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!election) {
      return res
        .status(404)
        .json({ status: "error", message: "Election not found" });
    }

    res.json({ status: "ok", election });
  } catch (err) {
    next(err);
  }
});

// Add candidate to an election
router.post("/elections/:id/candidates", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, party, manifesto } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ status: "error", message: "Candidate name is required" });
    }

    const election = await Election.findById(id);
    if (!election) {
      return res
        .status(404)
        .json({ status: "error", message: "Election not found" });
    }

    const candidate = await Candidate.create({
      election: election._id,
      name,
      party,
      manifesto,
    });

    res.status(201).json({ status: "ok", candidate });
  } catch (err) {
    next(err);
  }
});

// Dashboard summary: counts and aggregated votes per candidate
router.get("/dashboard-summary", async (req, res, next) => {
  try {
    const [electionsCount, candidatesCount, votesCount] = await Promise.all([
      Election.countDocuments(),
      Candidate.countDocuments(),
      Vote.countDocuments(),
    ]);

    const activeElection = await Election.findOne({ status: "ACTIVE" }).sort({
      createdAt: -1,
    });

    let results = [];
    if (activeElection) {
      results = await Vote.aggregate([
        { $match: { election: activeElection._id } },
        {
          $group: {
            _id: "$candidate",
            totalVotes: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "candidates",
            localField: "_id",
            foreignField: "_id",
            as: "candidate",
          },
        },
        { $unwind: "$candidate" },
        {
          $project: {
            _id: 0,
            candidateId: "$candidate._id",
            name: "$candidate.name",
            party: "$candidate.party",
            totalVotes: 1,
          },
        },
      ]);
    }

    res.json({
      status: "ok",
      summary: {
        elections: electionsCount,
        candidates: candidatesCount,
        totalVotes: votesCount,
        activeElection: activeElection || null,
        results,
      },
    });
  } catch (err) {
    next(err);
  }
});

// List all elections
router.get("/elections", async (req, res, next) => {
  try {
    const elections = await Election.find().sort({ createdAt: -1 }).lean();
    res.json({ status: "ok", elections });
  } catch (err) {
    next(err);
  }
});

// Import OTP utils
import { generateOtp, storeOtp, verifyOtp } from "../utils/otpStore.js";

// Initiate Result Declaration (Send OTP)
router.post("/elections/:id/declare-init", async (req, res, next) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ message: "Election not found" });

    const otp = generateOtp();
    storeOtp(`admin_declare_${election._id}`, otp);

    // Simulate SMS
    console.log(`[ADMIN OTP] Result Declaration Code for '${election.name}': ${otp}`);

    res.json({ status: "ok", message: "OTP sent to admin console" });
  } catch (err) {
    next(err);
  }
});

// Verify OTP and Publish Results
router.post("/elections/:id/declare-verify", async (req, res, next) => {
  try {
    const { otp } = req.body;
    const key = `admin_declare_${req.params.id}`;

    if (!verifyOtp(key, otp)) {
      return res.status(400).json({ status: "error", message: "Invalid or expired OTP" });
    }

    const election = await Election.findByIdAndUpdate(
      req.params.id,
      { resultsPublished: true },
      { new: true }
    );

    res.json({ status: "ok", election });
  } catch (err) {
    next(err);
  }
});

// Security logs listing with basic pagination
router.get("/logs", async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      AuditLog.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(),
    ]);

    res.json({
      status: "ok",
      page,
      total,
      items,
    });
  } catch (err) {
    next(err);
  }
});

export default router;


