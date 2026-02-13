import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, FileText, Type } from "lucide-react";

export function CreateElectionModal({ isOpen, onClose, onSubmit, loading }) {
    const [formData, setFormData] = React.useState({
        name: "",
        description: "",
        startsAt: "",
        endsAt: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
                >
                    <div className="flex items-center justify-between border-b border-slate-800 p-6">
                        <h3 className="text-lg font-bold text-white">Initialize New Election</h3>
                        <button
                            onClick={onClose}
                            className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Election Title
                            </label>
                            <div className="relative">
                                <Type className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                <input
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full rounded-xl border border-slate-700 bg-slate-800/50 pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    placeholder="e.g., Student Council Election 2024"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Description
                            </label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                <textarea
                                    required
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full rounded-xl border border-slate-700 bg-slate-800/50 pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[100px]"
                                    placeholder="Brief description of the election..."
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Start Date
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <input
                                        type="datetime-local"
                                        value={formData.startsAt}
                                        onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                                        className="w-full rounded-xl border border-slate-700 bg-slate-800/50 pl-10 pr-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    End Date
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <input
                                        type="datetime-local"
                                        value={formData.endsAt}
                                        onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                                        className="w-full rounded-xl border border-slate-700 bg-slate-800/50 pl-10 pr-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="rounded-xl bg-emerald-600 px-6 py-2 text-sm font-bold text-white transition-all hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Creating..." : "Create Election"}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
