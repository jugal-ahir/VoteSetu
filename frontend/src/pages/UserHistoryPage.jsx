import React from "react";
import { motion } from "framer-motion";
import { Clock, ShieldCheck, Calendar, FileText } from "lucide-react";
import { api } from "../lib/api.js";

export function UserHistoryPage() {
    const [votes, setVotes] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        api.get("/votes/history")
            .then(res => setVotes(res.data.votes))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="mx-auto max-w-4xl px-4 py-8">
            <div className="mb-8 flex items-center gap-4">
                <div className="rounded-xl bg-purple-500/10 p-3">
                    <Clock className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Voting History</h1>
                    <p className="text-slate-400">Your secure participation record</p>
                </div>
            </div>

            {loading ? (
                <div className="text-center text-slate-500">Loading records...</div>
            ) : votes.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center">
                    <p className="text-slate-400">No voting history found.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {votes.map((vote, i) => (
                        <motion.div
                            key={vote._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="group overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-6 transition-all hover:border-emerald-500/30"
                        >
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                                            Verified Vote
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            {new Date(vote.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white">{vote.election?.name || "Election Data Unavailable"}</h3>
                                    <p className="text-sm text-slate-400">{vote.election?.description || "ID: " + vote.electionId}</p>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-[10px] uppercase tracking-wider text-slate-500">Transaction Hash</p>
                                        <p className="font-mono text-xs text-emerald-500/80 truncate w-32 md:w-48">
                                            {vote.hash}
                                        </p>
                                    </div>
                                    {vote.election && vote.election.resultsPublished ? (
                                        <a href={`/results/${vote.election._id}`} className="rounded bg-slate-800 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-slate-700 hover:text-emerald-300 transition-colors">
                                            View Results
                                        </a>
                                    ) : (
                                        <span className="rounded bg-slate-800/50 px-3 py-1.5 text-xs font-semibold text-slate-500 cursor-not-allowed border border-slate-700/50">
                                            {vote.election ? "Results Pending" : "Archived"}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
