import express from "express";
import mongoose from "mongoose";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { Election } from "../models/Election.js";
import { Candidate } from "../models/Candidate.js";
import { Vote } from "../models/Vote.js";
import { AuditLog } from "../models/AuditLog.js";
import { authorizeDocument, preAuthorizeId } from "../utils/dbWatcher.js";

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

    // Pre-authorize the ID if we want to be safe, but since we don't have it yet,
    // we'll use a temporary approach or just authorize immediately after.
    // Actually, Mongoose can pre-generate IDs.
    const _id = new mongoose.Types.ObjectId();
    preAuthorizeId("elections", _id);

    const election = await Election.create({
      _id,
      name,
      description,
      startsAt,
      endsAt,
      status: "DRAFT",
    });

    // Authorize the new election in the security watcher
    await authorizeDocument("elections", election._id);

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

    if (req.io) {
      req.io.emit("election_status_update", {
        id: election._id,
        status: election.status,
      });
    }

    // Authorize this change in the security watcher
    await authorizeDocument("elections", election._id);

    res.json({ status: "ok", election });
  } catch (err) {
    next(err);
  }
});

// Get all unique candidates (for selection in new elections)
router.get("/candidates/search", async (req, res, next) => {
  try {
    const candidates = await Candidate.find()
      .select("name party manifesto")
      .lean();

    // Remove duplicates based on name+party combination
    const uniqueCandidates = [];
    const seen = new Set();

    for (const candidate of candidates) {
      const key = `${candidate.name}|${candidate.party}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueCandidates.push({
          name: candidate.name,
          party: candidate.party,
          manifesto: candidate.manifesto
        });
      }
    }

    res.json({ status: "ok", candidates: uniqueCandidates });
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

    const _id = new mongoose.Types.ObjectId();
    preAuthorizeId("candidates", _id);

    const candidate = await Candidate.create({
      _id,
      election: election._id,
      name,
      party,
      manifesto,
    });

    if (req.io) {
      req.io.emit("candidate_added", {
        electionId: id,
        candidate,
      });
    }

    // Authorize the election doc update (if any) and the new candidate
    // Candidate belongs to 'candidates' collection
    await authorizeDocument("candidates", candidate._id);

    res.status(201).json({ status: "ok", candidate });
  } catch (err) {
    next(err);
  }
});

// Dashboard summary: counts and aggregated votes per candidate
router.get("/dashboard-summary", async (req, res, next) => {
  try {
    const [electionsCount, votesCount] = await Promise.all([
      Election.countDocuments(),
      Vote.countDocuments(),
    ]);

    // Count unique candidate names to avoid duplicates when added to multiple elections
    const uniqueCandidates = await Candidate.distinct("name");
    const candidatesCount = uniqueCandidates.length;

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

    // Authorize the election result declaration
    await authorizeDocument("elections", election._id);

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


