import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Loader2 } from "lucide-react";

export function OtpModal({ isOpen, onClose, onVerify, loading, title = "Security Check" }) {
    const [otp, setOtp] = React.useState("");

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onVerify(otp);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
                >
                    <div className="flex items-center justify-between border-b border-slate-800 p-4">
                        <h3 className="flex items-center gap-2 font-bold text-white">
                            <Lock className="h-4 w-4 text-emerald-500" />
                            {title}
                        </h3>
                        <button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6">
                        <p className="mb-4 text-sm text-slate-400">
                            Please enter the 6-digit administrative verification code sent to your secure console/device to proceed.
                        </p>

                        <div className="mb-6">
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                                placeholder="000000"
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-4 text-center text-3xl font-bold tracking-[0.5em] text-white placeholder-slate-800 outline-none focus:border-emerald-500 transition-colors"
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 rounded-xl border border-slate-700 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-800"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={otp.length !== 6 || loading}
                                className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 hover:bg-emerald-500 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Declare"}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
