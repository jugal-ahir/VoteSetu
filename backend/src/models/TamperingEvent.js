import mongoose from "mongoose";

const tamperingEventSchema = new mongoose.Schema({
    collection: {
        type: String,
        required: true,
        enum: ["elections", "candidates", "votes", "users"],
    },
    operation: {
        type: String,
        required: true,
        enum: ["insert", "update", "delete"],
    },
    documentId: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    restored: {
        type: Boolean,
        default: false,
    },
    restoredAt: {
        type: Date,
    },
    changes: {
        type: mongoose.Schema.Types.Mixed,
    },
});

export const TamperingEvent = mongoose.model("TamperingEvent", tamperingEventSchema);
