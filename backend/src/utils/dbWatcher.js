import mongoose from "mongoose";
import { TamperingEvent } from "../models/TamperingEvent.js";

/**
 * Database Watcher - Monitors MongoDB collections for external changes
 * Uses polling-based detection (works with standalone MongoDB)
 * Tracks original state and detects restoration
 */

const collectionSnapshots = new Map();
const originalSnapshots = new Map(); // Track original state
const activeAlerts = new Map(); // Track active tampering events
const preAuthorizedIds = new Map(); // Track IDs we expect to be inserted
const POLL_INTERVAL = 3000; // Check every 3 seconds

export function setupDatabaseWatcher(io) {
    const collections = ["elections", "candidates", "votes", "users"];

    console.log("🔍 Initializing database tampering detection (polling mode)...");

    // Initialize snapshots
    const initializeSnapshots = async () => {
        for (const collectionName of collections) {
            try {
                const collection = mongoose.connection.collection(collectionName);
                const documents = await collection.find({}).toArray();

                // Store hash of each document
                const snapshot = new Map();
                const originalSnapshot = new Map();

                documents.forEach(doc => {
                    const docString = JSON.stringify(doc);
                    snapshot.set(doc._id.toString(), docString);
                    originalSnapshot.set(doc._id.toString(), doc); // Store raw BSON object
                });

                collectionSnapshots.set(collectionName, snapshot);
                originalSnapshots.set(collectionName, originalSnapshot);
                activeAlerts.set(collectionName, new Map());
                preAuthorizedIds.set(collectionName, new Set());

                console.log(`   ✓ Initialized snapshot for ${collectionName} (${documents.length} documents)`);
            } catch (error) {
                console.error(`❌ Failed to initialize ${collectionName}:`, error.message);
            }
        }
    };

    // Check for changes
    const checkForChanges = async () => {
        for (const collectionName of collections) {
            try {
                const collection = mongoose.connection.collection(collectionName);
                const currentDocs = await collection.find({}).toArray();
                const oldSnapshot = collectionSnapshots.get(collectionName);
                const originalSnapshot = originalSnapshots.get(collectionName);
                const alerts = activeAlerts.get(collectionName);
                const newSnapshot = new Map();

                // Check for updates and new documents
                for (const doc of currentDocs) {
                    const docId = doc._id.toString();
                    const docString = JSON.stringify(doc);
                    newSnapshot.set(docId, docString);

                    const oldDoc = oldSnapshot.get(docId);
                    const originalDoc = originalSnapshot.get(docId);

                    if (!oldDoc) {
                        // New document detected
                        // Check if this insertion was pre-authorized by the app
                        const preAuth = preAuthorizedIds.get(collectionName);
                        if (preAuth && preAuth.has(docId)) {
                            // Legitimate insertion, now it's part of our snapshot
                            preAuth.delete(docId);
                            // We don't alert, and it will be saved in newSnapshot below
                        } else {
                            await emitTamperingAlert(io, collectionName, "insert", docId, alerts);
                        }
                    } else if (oldDoc !== docString) {
                        // Document modified
                        // Use JSON.stringify for comparison to match docString
                        if (originalDoc && JSON.stringify(originalDoc) === docString) {
                            // Restored to original state!
                            await emitRestorationAlert(io, collectionName, docId, alerts);
                        } else {
                            // Still tampered or newly tampered
                            await emitTamperingAlert(io, collectionName, "update", docId, alerts);
                        }
                    }
                }

                // Check for deleted documents
                for (const [docId] of oldSnapshot) {
                    if (!newSnapshot.has(docId)) {
                        await emitTamperingAlert(io, collectionName, "delete", docId, alerts);
                    }
                }

                // Update snapshot
                collectionSnapshots.set(collectionName, newSnapshot);
            } catch (error) {
                console.error(`❌ Error checking ${collectionName}:`, error.message);
            }
        }
    };

    // Emit tampering alert
    const emitTamperingAlert = async (io, collection, operation, documentId, alerts) => {
        const alertKey = `${collection}_${documentId}`;

        // Check if already alerted
        if (alerts.has(alertKey)) {
            return; // Already have an active alert for this
        }

        const alert = {
            collection: collection,
            operation: operation,
            timestamp: new Date().toISOString(),
            documentId: documentId,
        };

        // Save to database
        try {
            const event = await TamperingEvent.create(alert);
            alerts.set(alertKey, event._id.toString());
        } catch (error) {
            console.error("Failed to save tampering event:", error.message);
        }

        io.emit("db_tampered", alert);

        console.log(`⚠️  DATABASE TAMPERING DETECTED:`, {
            collection: collection,
            operation: operation,
            timestamp: new Date().toISOString(),
            documentId: documentId,
        });
    };

    // Emit restoration alert
    const emitRestorationAlert = async (io, collection, documentId, alerts) => {
        const alertKey = `${collection}_${documentId}`;
        const eventId = alerts.get(alertKey);

        if (eventId) {
            // Update database event
            try {
                await TamperingEvent.findByIdAndUpdate(eventId, {
                    restored: true,
                    restoredAt: new Date(),
                });
            } catch (error) {
                console.error("Failed to update tampering event:", error.message);
            }

            // Remove from active alerts
            alerts.delete(alertKey);

            const restorationAlert = {
                collection: collection,
                documentId: documentId,
                timestamp: new Date().toISOString(),
            };

            io.emit("db_restored", restorationAlert);

            console.log(`✅ DATA RESTORED:`, {
                collection: collection,
                documentId: documentId,
                timestamp: new Date().toISOString(),
            });
        }
    };

    // Start monitoring
    initializeSnapshots().then(() => {
        console.log("✅ Database tampering detection active (polling every 3 seconds)");

        // Poll for changes
        setInterval(checkForChanges, POLL_INTERVAL);
    });
}

/**
 * Restores a document to its original state
 */
export async function restoreDocument(collectionName, documentId) {
    try {
        const originalSnapshot = originalSnapshots.get(collectionName);
        if (!originalSnapshot) {
            throw new Error(`Original snapshot for ${collectionName} not found`);
        }

        const originalData = originalSnapshot.get(documentId);
        if (!originalData) {
            throw new Error(`Original data for document ${documentId} not found`);
        }

        const collection = mongoose.connection.collection(collectionName);

        // DO NOT use JSON.parse(JSON.stringify) - it destroys ObjectIds!
        // We perform a shallow clone to safely remove the _id field
        const restorationData = { ...originalData };
        delete restorationData._id;

        await collection.replaceOne(
            { _id: new mongoose.Types.ObjectId(documentId) },
            restorationData,
            { upsert: true }
        );

        console.log(`✅ Dynamically restored ${collectionName}/${documentId} to original state`);
        return true;
    } catch (error) {
        console.error(`❌ Restoration failed for ${collectionName}/${documentId}:`, error.message);
        throw error;
    }
}

/**
 * Authorizes a legitimate change by updating the original snapshot
 * Prevents false positive alerts for authorized application actions
 */
export async function authorizeDocument(collectionName, documentId) {
    try {
        const collection = mongoose.connection.collection(collectionName);
        const doc = await collection.findOne({ _id: new mongoose.Types.ObjectId(documentId) });

        if (doc) {
            const docIdStr = documentId.toString();
            const docString = JSON.stringify(doc);

            // Update both snapshots to reflect this is the new "truth"
            if (collectionSnapshots.has(collectionName)) {
                collectionSnapshots.get(collectionName).set(docIdStr, docString);
            }
            if (originalSnapshots.has(collectionName)) {
                originalSnapshots.get(collectionName).set(docIdStr, doc);
            }

            // Clear any active alerts for this document
            const alerts = activeAlerts.get(collectionName);
            if (alerts) {
                const alertKey = `${collectionName}_${docIdStr}`;
                alerts.delete(alertKey);
            }

            console.log(`🛡️  Authorized update for ${collectionName}/${docIdStr}`);
        }
    } catch (error) {
        console.error(`❌ Failed to authorize ${collectionName}/${documentId}:`, error.message);
    }
}

/**
 * Registers an ID that is about to be inserted legitimately
 */
export function preAuthorizeId(collectionName, documentId) {
    const preAuth = preAuthorizedIds.get(collectionName);
    if (preAuth) {
        preAuth.add(documentId.toString());
        console.log(`📝 Pre-authorized insertion for ${collectionName}/${documentId}`);
    }
}

