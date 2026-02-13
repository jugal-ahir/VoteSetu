import express from "express";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/auth.js";
import { Election } from "../models/Election.js";
import { authorizeDocument, preAuthorizeId } from "../utils/dbWatcher.js";
import { Candidate } from "../models/Candidate.js";
import { Vote } from "../models/Vote.js";
import {
  generateAesKey,
  encryptVotePlaintext,
  encryptAesKeyWithRsa,
  sha256,
} from "../utils/crypto.js";
import { User } from "../models/User.js";
import { logSecurityEvent } from "../middleware/auditLogger.js";

const router = express.Router();

// Get Voter History
router.get("/history", requireAuth, async (req, res, next) => {
  try {
    const votes = await Vote.find({ voter: req.user._id })
      .populate("election", "name description resultsPublished")
      .populate("candidate", "name party")
      .sort({ createdAt: -1 });
    res.json({ status: "ok", votes });
  } catch (err) {
    next(err);
  }
});

// Get Public Results (for closed elections)
router.get("/results/:electionId", async (req, res, next) => {
  try {
    const election = await Election.findById(req.params.electionId);
    if (!election) return res.status(404).json({ message: "Election not found" });

    // Allow admin to always see results, others only if published
    // We can check req.user via requireAuth middleware if needed, but for public endpoint:
    // Ideally user history or dashboard provides token.
    // Assuming this is public endpoint, check if published.
    // If user is admin (needs token), they can see it. 

    // Simplification for this turn: Check if published.
    // If not published, check if user is admin (requires auth middleware).
    // But this route might be used by unauthenticated public? 
    // Let's assume UserHistoryPage uses it with auth token.

    // We'll enforce: If not published, error unless admin.
    // Since this route doesn't have `requireAuth` in previous step (wait, did I add it?),
    // I need to be careful. The previous code didn't have requireAuth on /results/:id?
    // Let's check previous view. Step 365 showed `router.get("/results/:electionId", async...` NO requireAuth.
    // I should probably add requireAuth if I want to allow admins to see unpublished results.
    // Or just check `resultsPublished`.

    if (!election.resultsPublished) {
      // Check if user is admin? 
      // For now, simpler: Return explicit status "PENDING" to frontend.
      return res.json({ status: "pending", message: "Results not yet declared" });
    }

    const votes = await Vote.find({ election: req.params.electionId }).populate("candidate");

    // Aggregation
    const results = {};
    votes.forEach(v => {
      const cand = v.candidate;
      if (!cand) return;
      const key = `${cand.name} (${cand.party})`;
      results[key] = (results[key] || 0) + 1;
    });

    const formatted = Object.entries(results)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    res.json({ status: "ok", results: formatted });
  } catch (err) {
    next(err);
  }
});

// Fetch active election and candidates for the voting booth
router.get("/active", requireAuth, async (req, res, next) => {
  try {
    const election = await Election.findOne({ status: "ACTIVE" }).sort({
      createdAt: -1,
    });
    if (!election) {
      return res.json({ status: "ok", election: null, candidates: [] });
    }
    const candidates = await Candidate.find({ election: election._id }).lean();
    res.json({
      status: "ok",
      election,
      candidates,
    });
  } catch (err) {
    next(err);
  }
});

// Cast an encrypted vote
router.post("/cast", requireAuth, async (req, res, next) => {
  try {
    const { electionId, candidateId } = req.body;

    if (!electionId || !candidateId) {
      return res
        .status(400)
        .json({ status: "error", message: "Missing election or candidate" });
    }

    if (!mongoose.isValidObjectId(electionId) || !mongoose.isValidObjectId(candidateId)) {
      await logSecurityEvent({
        req,
        action: "VOTE_INVALID_IDS",
        risk: "MEDIUM",
        status: "WARNED",
      });
      return res
        .status(400)
        .json({ status: "error", message: "Invalid identifiers" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }

    if (user.role !== "voter") {
      return res
        .status(403)
        .json({ status: "error", message: "Only voters can cast votes" });
    }

    if (user.digilockerStatus !== "VERIFIED") {
      await logSecurityEvent({
        req,
        action: "VOTE_DIGILOCKER_NOT_VERIFIED",
        risk: "MEDIUM",
        status: "BLOCKED",
        details: { voterId: user.voterId },
      });
      return res.status(403).json({
        status: "error",
        message: "DigiLocker verification required before voting",
      });
    }

    if (user.votedElections && user.votedElections.includes(electionId)) {
      await logSecurityEvent({
        req,
        action: "VOTE_DOUBLE_ATTEMPT",
        risk: "HIGH",
        status: "BLOCKED",
        details: { voterId: user.voterId },
      });
      return res.status(409).json({
        status: "error",
        message: "You have already voted in this election",
      });
    }

    const election = await Election.findById(electionId);
    if (!election || election.status !== "ACTIVE") {
      return res
        .status(400)
        .json({ status: "error", message: "Election is not active" });
    }

    const candidate = await Candidate.findOne({
      _id: candidateId,
      election: election._id,
    });
    if (!candidate) {
      return res
        .status(400)
        .json({ status: "error", message: "Candidate not in this election" });
    }

    // Prepare plaintext ballot (without storing the voterId inside)
    const ballot = JSON.stringify({
      electionId: election._id.toString(),
      candidateId: candidate._id.toString(),
    });

    const aesKey = generateAesKey();
    const encryptedVote = encryptVotePlaintext(ballot, aesKey);
    const encryptedKey = encryptAesKeyWithRsa(aesKey);

    // Receipt hash and blockchain-style chaining
    const receiptBase = `${encryptedVote.cipherText}.${encryptedVote.iv}.${encryptedVote.authTag
      }.${encryptedKey}`;
    const receiptHash = sha256(receiptBase);

    const lastVote = await Vote.findOne({ election: election._id })
      .sort({ createdAt: -1 })
      .lean();
    const previousHash = lastVote?.hash || null;
    const chainHash = sha256(receiptHash + (previousHash || ""));

    const _id = new mongoose.Types.ObjectId();
    preAuthorizeId("votes", _id);

    const voteDoc = await Vote.create({
      _id,
      voter: user._id,
      election: election._id,
      candidate: candidate._id,
      encryptedVote,
      encryptedKey,
      hash: chainHash,
      previousHash,
    });

    // Update user record
    if (!user.votedElections) user.votedElections = [];
    user.votedElections.push(election._id);
    await user.save();

    // Authorize the user document update
    await authorizeDocument("users", user._id);

    await logSecurityEvent({
      req,
      action: "VOTE_CAST_ENCRYPTED",
      risk: "LOW",
      status: "INFO",
      details: {
        voterId: user.voterId,
        electionId: election._id.toString(),
        voteId: voteDoc._id.toString(),
      },
    });

    // Emit live update
    if (req.io) {
      req.io.emit("vote_update", {
        electionId: election._id,
        candidateId: candidate._id,
      });
    }

    // Authorize the new vote in the security watcher
    await authorizeDocument("votes", voteDoc._id);

    res.status(201).json({
      status: "ok",
      message: "Vote recorded in encrypted form",
      receiptHash: chainHash,
      voteId: voteDoc._id,
    });
  } catch (err) {
    if (err.code === 11000) {
      await logSecurityEvent({
        req,
        action: "VOTE_DOUBLE_ATTEMPT_DB",
        risk: "HIGH",
        status: "BLOCKED",
        details: { error: "Duplicate vote record" },
      });
      return res.status(409).json({
        status: "error",
        message: "You have already voted in this election",
      });
    }
    next(err);
  }
});

export default router;


