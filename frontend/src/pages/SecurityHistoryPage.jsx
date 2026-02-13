import React from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Clock, CheckCircle, XCircle, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { RestorationAnimation } from "../components/RestorationAnimation.jsx";
import { ConfirmModal } from "../components/ConfirmModal.jsx";

export function SecurityHistoryPage() {
    const [events, setEvents] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [isRestoring, setIsRestoring] = React.useState(false);
    const [filter, setFilter] = React.useState("all"); // all, active, restored
    const [page, setPage] = React.useState(1);
    const [pagination, setPagination] = React.useState(null);
    const [modal, setModal] = React.useState({
        isOpen: false,
        title: "",
        message: "",
        type: "info",
        onConfirm: () => { },
    });
    const navigate = useNavigate();

    React.useEffect(() => {
        fetchEvents();
    }, [page]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/security/tampering-events?page=${page}&limit=20`);
            setEvents(res.data.events);
            setPagination(res.data.pagination);
        } catch (error) {
            console.error("Failed to fetch events:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (event) => {
        try {
            setIsRestoring(true);
            const animationTimer = new Promise(resolve => setTimeout(resolve, 3500));

            const restoreCall = api.post("/security/restore", {
                collection: event.collection,
                documentId: event.documentId
            });

            await Promise.all([restoreCall, animationTimer]);

            // Refresh events
            fetchEvents();

            setModal({
                isOpen: true,
                title: "Data Healed",
                message: "Integrity has been successfully restored for this entry using original blockchain-grade snapshots.",
                type: "success",
                confirmText: "Close",
                onConfirm: () => { }
            });
        } catch (err) {
            console.error("Restoration failed:", err);
            setModal({
                isOpen: true,
                title: "Restoration Error",
                message: err.response?.data?.message || "Failed to trigger digital healing protocol.",
                type: "danger",
                confirmText: "Close",
                onConfirm: () => { }
            });
        } finally {
            setIsRestoring(false);
        }
    };

    const filteredEvents = events.filter((event) => {
        if (filter === "active") return !event.restored;
        if (filter === "restored") return event.restored;
        return true;
    });

    const getOperationColor = (operation) => {
        switch (operation) {
            case "insert":
                return "text-blue-400";
            case "update":
                return "text-amber-400";
            case "delete":
                return "text-red-400";
            default:
                return "text-slate-400";
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => navigate("/admin")}
                    className="mb-4 text-sm text-slate-400 hover:text-slate-300 transition-colors"
                >
                    ← Back to Dashboard
                </button>
                <div className="flex items-center gap-3 mb-2">
                    <div className="rounded-full bg-red-500/20 p-2">
                        <ShieldAlert className="h-6 w-6 text-red-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-50">Security History</h1>
                </div>
                <p className="text-slate-400 text-sm">
                    Complete log of all database tampering events and restorations
                </p>
            </div>

            {/* Filters */}
            <div className="mb-6 flex gap-2">
                {["all", "active", "restored"].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                            }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Events Table */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Loading...</div>
                ) : filteredEvents.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">No events found</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-800/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">
                                        Timestamp
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">
                                        Collection
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">
                                        Operation
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">
                                        Document ID
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {filteredEvents.map((event) => (
                                    <motion.tr
                                        key={event._id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="hover:bg-slate-800/30 transition-colors"
                                    >
                                        <td className="px-6 py-4 text-sm text-slate-300">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-slate-500" />
                                                {new Date(event.timestamp).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 rounded-full bg-slate-800 text-xs font-mono font-semibold text-slate-300 uppercase">
                                                {event.collection}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-sm font-semibold uppercase ${getOperationColor(event.operation)}`}>
                                                {event.operation}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono text-slate-400">
                                            {event.documentId.substring(0, 12)}...
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {event.restored ? (
                                                    <div className="flex items-center gap-2 text-emerald-400">
                                                        <CheckCircle className="h-4 w-4" />
                                                        <span className="text-sm font-medium">Restored</span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex items-center gap-2 text-red-400 mr-2">
                                                            <XCircle className="h-4 w-4" />
                                                            <span className="text-sm font-medium">Active</span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRestore(event)}
                                                            className="px-3 py-1 rounded-lg bg-cyan-600/20 text-cyan-400 text-xs font-bold border border-cyan-500/30 hover:bg-cyan-600/40 transition-all flex items-center gap-1.5"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                            </svg>
                                                            Restore
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                    <div className="px-6 py-4 bg-slate-800/30 flex items-center justify-between">
                        <p className="text-sm text-slate-400">
                            Page {pagination.page} of {pagination.pages} ({pagination.total} total events)
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                                disabled={page === pagination.pages}
                                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <RestorationAnimation isVisible={isRestoring} />

            <ConfirmModal
                isOpen={modal.isOpen}
                onClose={() => setModal({ ...modal, isOpen: false })}
                {...modal}
            />
        </div>
    );
}
