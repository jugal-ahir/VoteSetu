import React from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Users,
  Vote,
  Plus,
  ArrowRight,
  TrendingUp,
  Activity,
  Calendar,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  Lock
} from "lucide-react";
import { api } from "../lib/api.js";
import { Link } from "react-router-dom";
import { ConfirmModal } from "../components/ConfirmModal.jsx";
import { OtpModal } from "../components/OtpModal.jsx";

export function AdminDashboardPage() {
  const [stats, setStats] = React.useState(null);
  const [elections, setElections] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  // Forms
  const [showCreate, setShowCreate] = React.useState(false);
  const [newElection, setNewElection] = React.useState({
    name: "",
    description: "",
    startsAt: "",
    endsAt: "",
  });

  const [showAddCand, setShowAddCand] = React.useState(null); // election ID
  const [newCandidate, setNewCandidate] = React.useState({
    name: "",
    party: "",
    manifesto: "",
  });

  // Modal States
  const [modal, setModal] = React.useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: () => { },
  });

  const [otpModal, setOtpModal] = React.useState({
    isOpen: false,
    electionId: null,
    loading: false
  });

  React.useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sRes, eRes] = await Promise.all([
        api.get("/admin/dashboard-summary"),
        api.get("/admin/elections"),
      ]);
      setStats(sRes.data.summary);
      setElections(eRes.data.elections);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createElection = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/elections", newElection);
      setShowCreate(false);
      fetchData();
      setModal({
        isOpen: true,
        title: "Success",
        message: "Election created successfully.",
        type: "success",
        confirmText: "OK",
        onConfirm: () => { },
      });
    } catch (err) {
      setModal({
        isOpen: true,
        title: "Error",
        message: "Failed to create election.",
        type: "danger",
        confirmText: "Close",
        onConfirm: () => { },
      });
    }
  };

  const initiateToggleStatus = (id, currentStatus) => {
    const next =
      currentStatus === "DRAFT"
        ? "ACTIVE"
        : currentStatus === "ACTIVE"
          ? "CLOSED"
          : "CLOSED";

    if (next === "CLOSED") {
      setModal({
        isOpen: true,
        title: "Close Election?",
        message: "Are you sure you want to close this election? Use 'Archive' only when counting is final.",
        type: "danger",
        confirmText: "Close Election",
        onConfirm: () => executeToggleStatus(id, next),
      });
    } else {
      executeToggleStatus(id, next);
    }
  };

  const executeToggleStatus = async (id, status) => {
    try {
      await api.patch(`/admin/elections/${id}/status`, { status });
      fetchData();
    } catch (err) {
      setModal({
        isOpen: true,
        title: "Error",
        message: "Failed to update election status.",
        type: "danger",
        confirmText: "Close",
        onConfirm: () => { },
      });
    }
  };

  const initiateDeclaration = async (electionId) => {
    // 1. Send OTP Request
    try {
      setOtpModal({ ...otpModal, loading: true });
      await api.post(`/admin/elections/${electionId}/declare-init`);
      // 2. Open OTP Modal
      setOtpModal({ isOpen: true, electionId, loading: false });
    } catch (err) {
      setModal({
        isOpen: true,
        title: "Error",
        message: "Failed to initiate result declaration.",
        type: "danger",
        confirmText: "Close",
        onConfirm: () => { }
      });
      setOtpModal({ ...otpModal, loading: false });
    }
  };

  const verifyDeclaration = async (otp) => {
    setOtpModal(prev => ({ ...prev, loading: true }));
    try {
      await api.post(`/admin/elections/${otpModal.electionId}/declare-verify`, { otp });
      setOtpModal({ isOpen: false, electionId: null, loading: false });
      fetchData();
      setModal({
        isOpen: true,
        title: "Results Declared",
        message: "The election results have been officially published and are now visible to voters.",
        type: "success",
        confirmText: "Done",
        onConfirm: () => { }
      });
    } catch (err) {
      setOtpModal(prev => ({ ...prev, loading: false }));
      setModal({
        isOpen: true,
        title: "Verification Failed",
        message: err.response?.data?.message || "Invalid OTP",
        type: "danger",
        confirmText: "Retry",
        onConfirm: () => { }
      });
    }
  };



  const addCandidate = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/admin/elections/${showAddCand}/candidates`, newCandidate);
      setShowAddCand(null);
      setNewCandidate({ name: "", party: "", manifesto: "" });
      fetchData();
      setModal({
        isOpen: true,
        title: "Success",
        message: "Candidate added successfully.",
        type: "success",
        confirmText: "OK",
        onConfirm: () => { },
      });
    } catch (err) {
      setModal({
        isOpen: true,
        title: "Error",
        message: "Failed to add candidate.",
        type: "danger",
        confirmText: "Close",
        onConfirm: () => { },
      });
    }
  };

  if (loading) return (
    <div className="flex h-[calc(100vh-6rem)] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <ConfirmModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        {...modal}
      />

      <OtpModal
        isOpen={otpModal.isOpen}
        onClose={() => setOtpModal({ ...otpModal, isOpen: false })}
        onVerify={verifyDeclaration}
        loading={otpModal.loading}
        title="Confirm Result Declaration"
      />



      <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1 text-xs font-semibold text-slate-300 mb-2">
            <Activity className="h-3 w-3 text-emerald-400" />
            System Operational
          </div>
          <h1 className="text-3xl font-bold text-white">Election Commission Console</h1>
          <p className="text-slate-400">real-time monitoring & administrative controls</p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/logs" className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700 transition-colors">
            <ShieldAlert className="h-4 w-4" /> Security Logs
          </Link>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/20 transition-all"
          >
            <Plus className="h-4 w-4" /> New Election
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-4 mb-10">
        {[
          { label: "Total Elections", value: stats?.elections || 0, icon: Calendar, color: "text-blue-400" },
          { label: "Candidates Registered", value: stats?.candidates || 0, icon: Users, color: "text-purple-400" },
          { label: "Votes Cast", value: stats?.totalVotes || 0, icon: Vote, color: "text-emerald-400" },
          { label: "Verification Rate", value: "100%", icon: CheckCircle2, color: "text-amber-400" },
        ].map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{item.label}</p>
                <h4 className="mt-2 text-3xl font-bold text-white">{item.value}</h4>
              </div>
              <item.icon className={`h-6 w-6 ${item.color} opacity-80`} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Form */}
      {showCreate && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-8 overflow-hidden rounded-2xl border border-slate-700 bg-slate-800/40 p-6 backdrop-blur-sm"
        >
          <h3 className="mb-4 text-lg font-bold text-white">Initialize New Election Protocol</h3>
          <form onSubmit={createElection} className="grid gap-4 md:grid-cols-2">
            <input
              placeholder="Election Title" required
              value={newElection.name}
              onChange={(e) => setNewElection({ ...newElection, name: e.target.value })}
              className="rounded-xl border border-slate-600 bg-slate-900/50 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
            />
            <input
              placeholder="Brief Description" required
              value={newElection.description}
              onChange={(e) => setNewElection({ ...newElection, description: e.target.value })}
              className="rounded-xl border border-slate-600 bg-slate-900/50 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
            />
            <div className="md:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
              <button type="submit" className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-bold text-white hover:bg-emerald-500">Initialize</button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Main Content: Live Results & Elections List */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Live Active Results */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-400" />
            Live Analytics
          </h3>
          {stats?.activeElection ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl">
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h4 className="text-2xl font-bold text-white">{stats.activeElection.name}</h4>
                  <p className="text-sm text-slate-400">Real-time vote counting active</p>
                </div>
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              </div>

              <div className="space-y-4">
                {stats.results.map((r, i) => {
                  const total = stats.results.reduce((acc, curr) => acc + curr.totalVotes, 0);
                  const percent = total > 0 ? (r.totalVotes / total) * 100 : 0;

                  return (
                    <div key={i} className="relative pt-2">
                      <div className="flex justify-between mb-1 text-sm">
                        <span className="font-bold text-white">{r.name} <span className="text-slate-500 font-normal">({r.party})</span></span>
                        <span className="font-mono text-emerald-400">{r.totalVotes} votes</span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          className="h-full bg-emerald-500"
                        />
                      </div>
                    </div>
                  );
                })}
                {stats.results.length === 0 && <p className="text-center text-slate-500 py-8 italic">No votes cast yet.</p>}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-12 text-center border-dashed">
              <p className="text-slate-500">No active election to monitor.</p>
            </div>
          )}
        </div>

        {/* Elections List */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-400" />
            Election Cycle
          </h3>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {elections.map((election) => (
              <motion.div
                key={election._id}
                layout
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 transition-all hover:border-slate-700 items-start"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide
                                ${election.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' :
                      election.status === 'CLOSED' ? 'bg-slate-700/50 text-slate-400' : 'bg-amber-500/20 text-amber-400'}
                             `}>
                    {election.status}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => initiateToggleStatus(election._id, election.status)}
                      disabled={election.status === "CLOSED"}
                      className="text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-30"
                    >
                      {election.status === 'DRAFT' ? 'Launch' : election.status === 'ACTIVE' ? 'End' : 'Archived'}
                    </button>

                    {/* Declare Result Logic */}
                    {election.status === "CLOSED" && (
                      !election.resultsPublished ? (
                        <button
                          onClick={() => initiateDeclaration(election._id)}
                          className="text-xs font-bold text-purple-400 hover:text-purple-300 ml-2"
                        >
                          Declare Result
                        </button>
                      ) : (
                        <Link to={`/results/${election._id}`} className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 ml-2 border border-emerald-500/30 rounded px-2 py-0.5 bg-emerald-500/10">
                          Results Declared
                        </Link>
                      )
                    )}

                    {/* Link for Active/Draft if needed, or just admin view results always? */}
                    {(election.resultsPublished || election.status === "ACTIVE") && (
                      <Link to={`/results/${election._id}`} className="text-xs font-semibold text-slate-500 hover:text-emerald-400 ml-2">
                        View
                      </Link>
                    )}
                  </div>
                </div>
                <h4 className="font-bold text-slate-200 mb-1">{election.name}</h4>
                {/* Add Candidate Section */}
                {election.status === "DRAFT" && (
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    {showAddCand === election._id ? (
                      <form onSubmit={addCandidate} className="space-y-2">
                        <input className="w-full text-xs bg-slate-950 border border-slate-700 rounded p-2 text-white"
                          placeholder="Candidate Name" value={newCandidate.name} onChange={e => setNewCandidate({ ...newCandidate, name: e.target.value })} required
                        />
                        <input className="w-full text-xs bg-slate-950 border border-slate-700 rounded p-2 text-white"
                          placeholder="Party" value={newCandidate.party} onChange={e => setNewCandidate({ ...newCandidate, party: e.target.value })} required
                        />
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => setShowAddCand(null)} className="text-[10px] text-slate-400">Cancel</button>
                          <button type="submit" className="text-[10px] bg-emerald-600 text-white px-2 py-1 rounded">Add</button>
                        </div>
                      </form>
                    ) : (
                      <button onClick={() => setShowAddCand(election._id)} className="flex items-center gap-1 text-xs text-emerald-400 hover:underline">
                        <Plus className="h-3 w-3" /> Add Candidate
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
