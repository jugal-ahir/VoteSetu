import React from "react";
import { motion } from "framer-motion";
import { 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Smartphone, 
  Monitor, 
  CheckCircle,
  AlertCircle,
  ShieldPlus,
  ArrowRight
} from "lucide-react";
import { api } from "../lib/api.js";
import { SecurityGauge } from "../components/SecurityGauge.jsx";

export function UserSecurityPage() {
  const [logs, setLogs] = React.useState([]);
  const [scoreData, setScoreData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const fetchData = async () => {
    try {
      const [lRes, sRes] = await Promise.all([
        api.get("/auth/me/security-logs"),
        api.get("/auth/me/security-score"),
      ]);
      setLogs(lRes.data.logs);
      setScoreData(sRes.data);
    } catch (err) {
      console.error("Failed to fetch user security data", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex h-[400px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-12">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-black tracking-tight text-white mb-3">Security Scorecard</h1>
        <p className="text-slate-400">Your account's health and recent security events</p>
      </div>

      {/* Main Stats Row */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Score & Factors */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-10 flex flex-col items-center">
          <SecurityGauge score={scoreData?.score || 0} size={240} />
          
          <div className="mt-10 w-full space-y-4">
            {scoreData?.details.map((d, i) => (
              <div key={i} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${d.status === 'GOOD' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                    {d.status === 'GOOD' ? <CheckCircle className="h-4 w-4" /> : <ShieldPlus className="h-4 w-4" />}
                  </div>
                  <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{d.factor}</span>
                </div>
                <span className={`text-xs font-mono font-bold ${d.status === 'GOOD' ? 'text-emerald-400' : 'text-slate-500'}`}>
                  +{d.weight}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Center / Tips */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Security Checkpoint
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Your account is currently protected by 2FA and DigiLocker identity verification.
            </p>
            <div className="grid gap-2">
               <button className="flex items-center justify-between w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:border-emerald-500/30 transition-all">
                  <span>Enhance Login Security</span>
                  <ArrowRight className="h-3.5 w-3.5" />
               </button>
            </div>
          </div>

          <div className="space-y-4">
             <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2 px-2">
                <AlertCircle className="h-4 w-4" />
                Security Tips
             </h3>
             {[
               "Never share your Voter ID or OTP with anyone.",
               "Regularly audit your login history below.",
               "Use a unique password for VoteSetu."
             ].map((tip, i) => (
               <div key={i} className="flex gap-3 text-xs text-slate-400 items-start">
                  <div className="mt-1 h-1 w-1 rounded-full bg-slate-700 flex-shrink-0" />
                  <span>{tip}</span>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Login History Timeline */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-400" />
          Recent Security Events
        </h2>
        
        <div className="rounded-3xl border border-slate-800 bg-slate-900/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-900 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Time & Action</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Device & Browser</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Location (IP)</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {logs.map((log, i) => (
                  <motion.tr 
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-slate-800/20 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-200">{log.action.replace(/_/g, ' ')}</span>
                        <span className="text-[10px] text-slate-500">{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {log.device === 'Mobile' ? <Smartphone className="h-4 w-4 text-slate-400" /> : <Monitor className="h-4 w-4 text-slate-400" />}
                        <span className="text-xs text-slate-300">{log.os} · {log.browser}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                         <MapPin className="h-3.5 w-3.5 text-slate-500" />
                         <span className="text-xs text-slate-300">{log.location?.city}, {log.location?.country}</span>
                       </div>
                       <span className="text-[10px] font-mono text-slate-600">{log.ip}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest
                        ${log.status === 'BLOCKED' ? 'bg-red-500/10 text-red-500' : 
                          log.status === 'WARNED' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {log.status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
