import express from "express";
import { TamperingEvent } from "../models/TamperingEvent.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { restoreDocument } from "../utils/dbWatcher.js";

import { AuditLog } from "../models/AuditLog.js";

const router = express.Router();

// Get security stats summary
router.get("/stats/summary", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const totalEvents = await AuditLog.countDocuments();
        const flaggedEvents = await AuditLog.countDocuments({ risk: { $in: ["HIGH", "CRITICAL"] } });
        const blockedEvents = await AuditLog.countDocuments({ status: "BLOCKED" });
        
        // Dynamic integrity check (simplified)
        const recentTampering = await TamperingEvent.countDocuments({ restored: false });
        const integrityScore = Math.max(0, 100 - (recentTampering * 10));

        res.json({
            totalEvents,
            flaggedEvents,
            blockedEvents,
            integrityScore,
            systemStatus: recentTampering > 0 ? "WARNING" : "SECURE"
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch security summary" });
    }
});

// Get attack distribution by type
router.get("/stats/attacks", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const distribution = await AuditLog.aggregate([
            { $group: { _id: "$action", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);
        res.json({ distribution: distribution.map(d => ({ type: d._id, count: d.count })) });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch attack distribution" });
    }
});

// Get geographic distribution of security events
router.get("/stats/geo-distribution", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const geoData = await AuditLog.aggregate([
            { $match: { "location.coordinates.lat": { $exists: true } } },
            {
                $group: {
                    _id: "$location.city",
                    country: { $first: "$location.country" },
                    lat: { $first: "$location.coordinates.lat" },
                    lng: { $first: "$location.coordinates.lng" },
                    count: { $sum: 1 },
                    riskLevel: { $max: "$risk" }
                }
            }
        ]);
        res.json({ geoData });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch geo distribution" });
    }
});

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

