import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, X, AlertTriangle } from "lucide-react";

export function SecurityAlert({ alerts, onDismiss, onRestore }) {
    if (!alerts || alerts.length === 0) return null;

    const latestAlert = alerts[alerts.length - 1];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="relative w-full max-w-lg mx-4"
                >
                    {/* Pulsing glow effect */}
                    <div className="absolute inset-0 rounded-3xl bg-red-500/20 blur-2xl animate-pulse" />

                    <div className="relative rounded-3xl border-2 border-red-500/50 bg-slate-900 p-8 shadow-2xl">
                        {/* Close button */}
                        <button
                            onClick={() => onDismiss(latestAlert.timestamp)}
                            className="absolute top-4 right-4 rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {/* Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="relative">
                                <div className="absolute inset-0 rounded-full bg-red-500/30 blur-xl animate-pulse" />
                                <div className="relative rounded-full bg-red-500/20 p-4">
                                    <ShieldAlert className="h-12 w-12 text-red-400" />
                                </div>
                            </div>
                        </div>

                        {/* Title */}
                        <h2 className="text-center text-2xl font-bold text-red-400 mb-2 flex items-center justify-center gap-2">
                            <AlertTriangle className="h-6 w-6" />
                            SECURITY ALERT
                        </h2>

                        {/* Message */}
                        <p className="text-center text-slate-300 mb-6">
                            Database Tampering Detected
                        </p>

                        {/* Details */}
                        <div className="space-y-3 rounded-xl bg-slate-950/50 p-4 border border-red-500/20">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Collection:</span>
                                <span className="font-mono font-semibold text-red-400 uppercase">
                                    {latestAlert.collection}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Operation:</span>
                                <span className="font-mono font-semibold text-amber-400 uppercase">
                                    {latestAlert.operation}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Timestamp:</span>
                                <span className="font-mono text-slate-300 text-xs">
                                    {new Date(latestAlert.timestamp).toLocaleString()}
                                </span>
                            </div>
                            {latestAlert.documentId && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Document ID:</span>
                                    <span className="font-mono text-slate-400 text-xs truncate max-w-[200px]">
                                        {latestAlert.documentId}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Warning message */}
                        <div className="mt-6 rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
                            <p className="text-xs text-amber-200 text-center leading-relaxed">
                                ⚠️ External modification detected. The database was changed outside the application.
                                Please verify data integrity immediately.
                            </p>
                        </div>

                        {/* Action buttons */}
                        <div className="mt-6 space-y-3">
                            <button
                                onClick={() => onRestore(latestAlert)}
                                className="w-full rounded-xl bg-cyan-600 py-3 text-sm font-bold text-white transition-all hover:bg-cyan-500 hover:shadow-lg hover:shadow-cyan-500/20 flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Automated Data Restoration
                            </button>

                            <button
                                onClick={() => onDismiss(latestAlert.timestamp)}
                                className="w-full rounded-xl bg-slate-800 py-3 text-sm font-bold text-slate-300 transition-all hover:bg-slate-700 hover:text-white"
                            >
                                Acknowledge & Dismiss
                            </button>
                        </div>

                        {/* Alert count */}
                        {alerts.length > 1 && (
                            <p className="mt-4 text-center text-xs text-slate-500">
                                {alerts.length} alert{alerts.length > 1 ? 's' : ''} detected
                            </p>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
