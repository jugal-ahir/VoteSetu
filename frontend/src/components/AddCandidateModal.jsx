import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Flag, FileText, Search } from "lucide-react";
import { api } from "../lib/api.js";

export function AddCandidateModal({ isOpen, onClose, onSubmit, loading }) {
    const [mode, setMode] = React.useState("new"); // "new" or "existing"
    const [existingCandidates, setExistingCandidates] = React.useState([]);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [formData, setFormData] = React.useState({
        name: "",
        party: "",
        manifesto: "",
    });

    React.useEffect(() => {
        if (isOpen && mode === "existing") {
            fetchExistingCandidates();
        }
    }, [isOpen, mode]);

    const fetchExistingCandidates = async () => {
        try {
            const res = await api.get("/admin/candidates/search");
            setExistingCandidates(res.data.candidates || []);
        } catch (err) {
            console.error("Failed to fetch candidates:", err);
        }
    };

    const handleSelectExisting = (candidate) => {
        setFormData({
            name: candidate.name,
            party: candidate.party,
            manifesto: candidate.manifesto,
        });
        setMode("new"); // Switch to form view with pre-filled data
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
        setFormData({ name: "", party: "", manifesto: "" });
        setMode("new");
    };

    const filteredCandidates = existingCandidates.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.party.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                        <h3 className="text-lg font-bold text-white">Add Candidate</h3>
                        <button
                            onClick={onClose}
                            className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex gap-2 p-4 bg-slate-950/50">
                        <button
                            onClick={() => setMode("new")}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${mode === "new"
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-800 text-slate-400 hover:text-white"
                                }`}
                        >
                            New Profile
                        </button>
                        <button
                            onClick={() => setMode("existing")}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${mode === "existing"
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-800 text-slate-400 hover:text-white"
                                }`}
                        >
                            Existing Profile
                        </button>
                    </div>

                    {mode === "existing" ? (
                        <div className="p-6 space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                <input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full rounded-xl border border-slate-700 bg-slate-800/50 pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                                    placeholder="Search candidates..."
                                />
                            </div>
                            <div className="max-h-[300px] overflow-y-auto space-y-2">
                                {filteredCandidates.length === 0 ? (
                                    <p className="text-center text-slate-500 py-8 text-sm">No candidates found.</p>
                                ) : (
                                    filteredCandidates.map((candidate, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSelectExisting(candidate)}
                                            className="w-full text-left p-4 rounded-xl border border-slate-800 bg-slate-800/30 hover:bg-slate-800 hover:border-emerald-500/50 transition-all"
                                        >
                                            <div className="font-semibold text-white">{candidate.name}</div>
                                            <div className="text-xs text-slate-400">{candidate.party}</div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Candidate Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <input
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full rounded-xl border border-slate-700 bg-slate-800/50 pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                        placeholder="Full Name"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Party / Affiliation
                                </label>
                                <div className="relative">
                                    <Flag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <input
                                        required
                                        value={formData.party}
                                        onChange={(e) => setFormData({ ...formData, party: e.target.value })}
                                        className="w-full rounded-xl border border-slate-700 bg-slate-800/50 pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                        placeholder="Party Name or Independent"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Manifesto / Description
                                </label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                    <textarea
                                        required
                                        value={formData.manifesto}
                                        onChange={(e) => setFormData({ ...formData, manifesto: e.target.value })}
                                        className="w-full rounded-xl border border-slate-700 bg-slate-800/50 pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[100px]"
                                        placeholder="Key promises and manifesto points..."
                                    />
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
                                    {loading ? "Adding..." : "Add Candidate"}
                                </button>
                            </div>
                        </form>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
