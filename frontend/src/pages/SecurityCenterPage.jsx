import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  ShieldAlert, 
  Zap, 
  Globe, 
  Activity, 
  AlertTriangle,
  ArrowRight,
  ShieldIcon,
  RefreshCw
} from "lucide-react";
import { api } from "../lib/api.js";
import { AttackMap } from "../components/AttackMap.jsx";
import { socket } from "../App.jsx";

export function SecurityCenterPage() {
  const [summary, setSummary] = React.useState(null);
  const [attacks, setAttacks] = React.useState([]);
  const [geoData, setGeoData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [lastUpdate, setLastUpdate] = React.useState(new Date());

  const fetchData = async () => {
    try {
      const [sRes, aRes, gRes] = await Promise.all([
        api.get("/security/stats/summary"),
        api.get("/security/stats/attacks"),
        api.get("/security/stats/geo-distribution"),
      ]);
      setSummary(sRes.data);
      setAttacks(aRes.data.distribution);
      setGeoData(gRes.data.geoData);
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Failed to fetch security stats", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
    
    // Listen for real-time security events to trigger a refresh or incremental update
    socket.on("db_tampered", () => fetchData());
    socket.on("db_restored", () => fetchData());
    
    socket.on("security_alert", (alert) => {
      setSummary(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          totalEvents: (prev.totalEvents || 0) + 1,
          flaggedEvents: (alert.risk === 'HIGH' || alert.risk === 'CRITICAL') ? (prev.flaggedEvents || 0) + 1 : (prev.flaggedEvents || 0),
          blockedEvents: alert.status === 'BLOCKED' ? (prev.blockedEvents || 0) + 1 : (prev.blockedEvents || 0)
        };
      });
      setLastUpdate(new Date());
    });
    
    const interval = setInterval(fetchData, 60000); // Background sync every minute
    return () => {
      socket.off("db_tampered");
      socket.off("db_restored");
      socket.off("security_alert");
      clearInterval(interval);
    };
  }, []);

  if (loading && !summary) return (
    <div className="flex h-[400px] items-center justify-center">
      <RefreshCw className="h-8 w-8 animate-spin text-emerald-500" />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400 mb-2">
            <ShieldAlert className="h-3 w-3" />
            Active Threat Monitoring
          </div>
          <h1 className="text-3xl font-bold text-white">Security Command Center</h1>
          <p className="text-slate-400">Real-time intrusion detection & system integrity</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Last Update</p>
          <p className="text-sm font-semibold text-slate-300">{lastUpdate.toLocaleTimeString()}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-4">
        {[
          { 
            label: "Integrity Score", 
            value: `${summary?.integrityScore || 100}%`, 
            icon: ShieldCheck, 
            color: (summary?.integrityScore || 100) > 90 ? "text-emerald-400" : "text-amber-400",
            sub: "DB Snapshot Match" 
          },
          { 
            label: "Total Events", 
            value: summary?.totalEvents || 0, 
            icon: Activity, 
            color: "text-blue-400",
            sub: "Audit Log Entries"
          },
          { 
            label: "Blocked Attacks", 
            value: summary?.blockedEvents || 0, 
            icon: Zap, 
            color: "text-purple-400",
            sub: "WAF & Rate-Limit"
          },
          { 
            label: "Risk Alerts", 
            value: summary?.flaggedEvents || 0, 
            icon: AlertTriangle, 
            color: "text-red-400",
            sub: "High Risk Patterns"
          },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{s.label}</p>
                <h3 className={`mt-1 text-2xl font-black ${s.color}`}>{s.value}</h3>
                <p className="mt-1 text-[10px] text-slate-400 uppercase tracking-wide">{s.sub}</p>
              </div>
              <div className={`rounded-lg bg-slate-800 p-2 ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Visualization Row */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* World Attack Map */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Globe className="h-4 w-4 text-emerald-400" />
              Threat Geographic Distribution
            </h3>
            <span className="text-[10px] font-bold uppercase text-slate-500">Global Perspective</span>
          </div>
          <AttackMap points={geoData} />
        </div>

        {/* Attack Vector Analysis */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldIcon className="h-4 w-4 text-purple-400" />
            Top Threat Vectors
          </h3>
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
            {attacks.map((a, i) => {
              const max = Math.max(...attacks.map(x => x.count), 1);
              const percent = (a.count / max) * 100;
              return (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                    <span className="text-slate-300">{a.type.replace(/_/g, ' ')}</span>
                    <span className="text-emerald-400 font-mono">{a.count} hits</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                    />
                  </div>
                </div>
              );
            })}
            {attacks.length === 0 && (
              <div className="text-center py-12 text-slate-500 text-sm italic">
                No attack vectors detected.
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/10 p-4">
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">System Recommendation</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              System is currently operational under normal load. MongoDB Watcher is active across all collections.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
