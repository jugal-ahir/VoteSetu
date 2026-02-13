import express from "express";
import { TamperingEvent } from "../models/TamperingEvent.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { restoreDocument } from "../utils/dbWatcher.js";

const router = express.Router();

// Get all tampering events (with pagination)
router.get("/tampering-events", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const total = await TamperingEvent.countDocuments();
        const events = await TamperingEvent.find()
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            events,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch tampering events" });
    }
});

// Get active (unrestored) tampering events
router.get("/tampering-events/active", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const events = await TamperingEvent.find({ restored: false }).sort({
            timestamp: -1,
        });
        res.json({ events });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch active events" });
    }
});

// Restore document to original state
router.post("/restore", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const { collection, documentId } = req.body;
        await restoreDocument(collection, documentId);
        res.json({ success: true, message: "Data restored successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message || "Failed to restore data" });
    }
});

export default router;

