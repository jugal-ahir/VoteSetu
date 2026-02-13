import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText, ShieldAlert, Search, Filter, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "../lib/api.js";

export function LogsViewerPage() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(20);

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/logs?page=${page}&limit=${limit}`);
      setLogs(
        (res.data.items || []).map((item) => ({
          id: item._id,
          time: new Date(item.createdAt).toLocaleString(),
          ip: item.ip || "Unknown",
          action: item.action,
          risk: item.risk,
          status: item.status,
        }))
      );
      // Construct total pages from total count
      const totalDocs = res.data.total || 0;
      setTotalPages(Math.ceil(totalDocs / limit));
    } catch (err) {
      setError("Unable to load security logs.");
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log =>
    log.action.toLowerCase().includes(filter.toLowerCase()) ||
    log.status.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-emerald-400" />
            Security Audit Log
          </h1>
          <p className="text-slate-400 mt-1">Immutable record of all system events and security anomalies</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            placeholder="Search current view..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:border-emerald-500 outline-none w-full md:w-64"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800/50">
              <thead className="bg-slate-950/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Timestamp</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Event Action</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Risk Level</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Outcome</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Source IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-xs font-medium text-slate-300 whitespace-nowrap">{log.time}</td>
                    <td className="px-6 py-4 text-sm font-bold text-white max-w-xs truncate" title={log.action}>{log.action}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide
                                ${log.risk === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                          log.risk === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}
                            `}>
                        {log.risk}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium
                                ${log.status === 'BLOCKED' ? 'text-red-400' :
                          log.status === 'WARNED' ? 'text-amber-400' : 'text-emerald-400'}
                             `}>
                        {log.status === 'SUCCESS' && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-500">{log.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-800 p-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <div className="text-xs font-medium text-slate-500">
                Page <span className="text-white">{page}</span> of <span className="text-white">{totalPages}</span>
              </div>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {filteredLogs.length === 0 && !loading && (
            <div className="p-12 text-center text-slate-500">
              No logs found matching your criteria.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
