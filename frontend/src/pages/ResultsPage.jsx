import React from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Trophy, Clock } from "lucide-react";
import { api } from "../lib/api.js";
import { useParams } from "react-router-dom";

export function ResultsPage() {
    const { id } = useParams();
    const [results, setResults] = React.useState([]);
    const [status, setStatus] = React.useState("loading"); // loading, ok, pending

    React.useEffect(() => {
        api.get(`/votes/results/${id}`)
            .then(res => {
                if (res.data.status === "pending") {
                    setStatus("pending");
                } else {
                    setResults(res.data.results || []);
                    setStatus("ok");
                }
            })
            .catch(err => {
                console.error(err);
                setStatus("error");
            });
    }, [id]);

    if (status === "loading") return <div className="flex h-[50vh] items-center justify-center text-slate-500"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>;

    if (status === "error") return <div className="text-center text-slate-500 mt-20">Failed to load results.</div>;

    if (status === "pending") {
        return (
            <div className="mx-auto max-w-lg px-4 py-20 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 border border-slate-800">
                    <Clock className="h-10 w-10 text-slate-500" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-3">Results Pending</h1>
                <p className="text-slate-400 text-lg leading-relaxed">
                    The election commission has not declared the results for this election yet. <br />
                    Please check back later for the official count.
                </p>
            </div>
        );
    }

    const totalVotes = results.reduce((acc, curr) => acc + curr.count, 0);

    return (
        <div className="mx-auto max-w-4xl px-4 py-8">
            <div className="mb-8 flex items-center gap-4">
                <div className="rounded-xl bg-blue-500/10 p-3">
                    <Trophy className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Election Results</h1>
                    <p className="text-slate-400">Official count and statistics</p>
                </div>
            </div>


            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-4">
                    {results.map((r, i) => {
                        const percent = totalVotes > 0 ? (r.count / totalVotes) * 100 : 0;
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 p-4"
                            >
                                <div className="relative z-10 flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold text-white text-lg">{r.name}</h4>
                                        <p className="text-sm text-slate-400">Votes: {r.count}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-2xl font-bold text-emerald-400">{percent.toFixed(1)}%</span>
                                    </div>
                                </div>
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-slate-800">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percent}%` }}
                                        className={`h-full ${i === 0 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                                    />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 h-fit">
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-500">Summary</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between border-b border-slate-800 pb-2">
                            <span className="text-slate-400">Total Votes</span>
                            <span className="font-mono text-white">{totalVotes}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
