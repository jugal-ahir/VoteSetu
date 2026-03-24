import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  Users,
  Vote,
  Plus,
  ArrowRight,
  TrendingUp,
  Activity,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  Lock,
  Clock,
  Archive,
  Play,
  History
} from "lucide-react";
import { api } from "../lib/api.js";
import { Link } from "react-router-dom";
import { ConfirmModal } from "../components/ConfirmModal.jsx";
import { OtpModal } from "../components/OtpModal.jsx";
import { CreateElectionModal } from "../components/CreateElectionModal.jsx";
import { AddCandidateModal } from "../components/AddCandidateModal.jsx";
import { SecurityAlert } from "../components/SecurityAlert.jsx";
import { RestorationAnimation } from "../components/RestorationAnimation.jsx";
import { socket } from "../App.jsx";

export function AdminDashboardPage() {
  const [stats, setStats] = React.useState(null);
  const [elections, setElections] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState("active"); // active, drafts, history
  const [isRestoring, setIsRestoring] = React.useState(false);

  // Modals State
  const [showCreateElection, setShowCreateElection] = React.useState(false);
  const [showAddCandidate, setShowAddCandidate] = React.useState(null); // election ID
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Common Modal States
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

  // Pagination State for History
  const [historyPage, setHistoryPage] = React.useState(1);
  const historyPerPage = 1;

  // Security Alerts State
  const [securityAlerts, setSecurityAlerts] = React.useState([]);

  React.useEffect(() => {
    fetchData();

    // Socket listeners for real-time updates
    socket.on("vote_update", () => {
      fetchData();
    });

    socket.on("election_status_update", () => {
      fetchData();
    });

    socket.on("candidate_added", () => {
      fetchData();
    });

    socket.on("db_tampered", (alert) => {
      setSecurityAlerts((prev) => [...prev, alert]);
      console.warn("⚠️ Database Tampering Detected:", alert);
    });

    socket.on("db_restored", (restoration) => {
      // Auto-dismiss matching alert
      setSecurityAlerts((prev) =>
        prev.filter(
          (a) =>
            !(a.collection === restoration.collection && a.documentId === restoration.documentId)
        )
      );
      console.log("✅ Data Restored:", restoration);
    });

    return () => {
      socket.off("vote_update");
      socket.off("election_status_update");
      socket.off("candidate_added");
      socket.off("db_tampered");
      socket.off("db_restored");
    };
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

  const handleCreateElection = async (formData) => {
    setIsSubmitting(true);
    try {
      await api.post("/admin/elections", formData);
      setShowCreateElection(false);
      fetchData();
      setModal({
        isOpen: true,
        title: "Success",
        message: "Election initialized successfully.",
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCandidate = async (formData) => {
    setIsSubmitting(true);
    try {
      await api.post(`/admin/elections/${showAddCandidate}/candidates`, formData);
      setShowAddCandidate(null);
      fetchData();
      setModal({
        isOpen: true,
        title: "Success",
        message: "Candidate registered to election protocol.",
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
    } finally {
      setIsSubmitting(false);
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
    try {
      setOtpModal({ ...otpModal, loading: true });
      await api.post(`/admin/elections/${electionId}/declare-init`);
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
        message: "The election results have been officially published.",
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

  const handleRestore = async (alert) => {
    setIsRestoring(true);
    try {
      // Let the animation play for at least 3.5 seconds
      const animationTimer = new Promise(resolve => setTimeout(resolve, 3500));

      const restoreCall = api.post("/security/restore", {
        collection: alert.collection,
        documentId: alert.documentId
      });

      await Promise.all([restoreCall, animationTimer]);

      // Clear the alert
      setSecurityAlerts((prev) => prev.filter((a) => a.timestamp !== alert.timestamp));

      setModal({
        isOpen: true,
        title: "Integrity Restored",
        message: "The database has been successfully reverted to its original state. All tampering has been neutralized.",
        type: "success",
        confirmText: "Back to Dashboard",
        onConfirm: () => { }
      });
    } catch (err) {
      console.error("Restoration failed:", err);
      setModal({
        isOpen: true,
        title: "Restoration Failed",
        message: err.response?.data?.message || "Critical error during data healing process.",
        type: "danger",
        confirmText: "Close",
        onConfirm: () => { }
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const filteredElections = elections.filter(e => {
    if (activeTab === "active") return e.status === "ACTIVE";
    if (activeTab === "drafts") return e.status === "DRAFT";
    if (activeTab === "history") return e.status === "CLOSED";
    return true;
  });

  // Calculate pagination for history
  const historyElections = elections.filter(e => e.status === "CLOSED");
  const totalHistoryPages = Math.ceil(historyElections.length / historyPerPage);

  const displayElections = activeTab === "history"
    ? historyElections.slice((historyPage - 1) * historyPerPage, historyPage * historyPerPage)
    : filteredElections;

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

      <RestorationAnimation isVisible={isRestoring} />

      {/* Security Alert */}
      <SecurityAlert
        alerts={securityAlerts}
        onDismiss={(timestamp) => {
          setSecurityAlerts((prev) => prev.filter((a) => a.timestamp !== timestamp));
        }}
        onRestore={handleRestore}
      />

      <CreateElectionModal
        isOpen={showCreateElection}
        onClose={() => setShowCreateElection(false)}
        onSubmit={handleCreateElection}
        loading={isSubmitting}
      />

      <AddCandidateModal
        isOpen={!!showAddCandidate}
        onClose={() => setShowAddCandidate(null)}
        onSubmit={handleAddCandidate}
        loading={isSubmitting}
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
          <Link to="/admin/security-center" className="flex items-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-900/10 px-4 py-2.5 text-sm font-bold text-emerald-400 hover:bg-emerald-900/20 transition-colors shadow-lg shadow-emerald-900/20">
            <ShieldCheck className="h-4 w-4" /> Security Center
          </Link>
          <Link to="/admin/logs" className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700 transition-colors">
            <ShieldAlert className="h-4 w-4" /> Security Logs
          </Link>
          <Link to="/admin/security-history" className="flex items-center gap-2 rounded-xl border border-red-700/50 bg-red-900/20 px-4 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-900/30 transition-colors">
            <History className="h-4 w-4" /> Tampering History
          </Link>
          <button
            onClick={() => setShowCreateElection(true)}
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

        {/* Elections Cycle Manager */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-400" />
              Election Cycle
            </h3>
          </div>

          <div className="flex gap-1 p-1 bg-slate-900/50 rounded-xl border border-slate-800">
            {["active", "drafts", "history"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === tab
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-300"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {displayElections.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 text-slate-500 text-sm"
                >
                  No {activeTab} elections found.
                </motion.div>
              )}
              {displayElections.map((election) => (
                <motion.div
                  key={election._id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 transition-all hover:border-slate-700 items-start group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide
                                  ${election.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' :
                        election.status === 'CLOSED' ? 'bg-slate-700/50 text-slate-400' : 'bg-amber-500/20 text-amber-400'}
                               `}>
                      {election.status}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {election.status === "DRAFT" && (
                        <button
                          onClick={() => initiateToggleStatus(election._id, election.status)}
                          className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors"
                          title="Launch Election"
                        >
                          <Play className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {election.status === "ACTIVE" && (
                        <button
                          onClick={() => initiateToggleStatus(election._id, election.status)}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                          title="End Election"
                        >
                          <Lock className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {/* Declare Result Logic */}
                      {election.status === "CLOSED" && (
                        !election.resultsPublished ? (
                          <button
                            onClick={() => initiateDeclaration(election._id)}
                            className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500 hover:text-white transition-colors"
                            title="Declare Results"
                          >
                            <ShieldAlert className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <Link to={`/results/${election._id}`} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        )
                      )}
                    </div>
                  </div>

                  <h4 className="font-bold text-slate-200 mb-1">{election.name}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{election.description}</p>

                  {/* Add Candidate Section */}
                  {election.status === "DRAFT" && (
                    <div className="mt-4 pt-4 border-t border-slate-800/50 flex justify-between items-center">
                      <span className="text-[10px] text-slate-500">Candidates managed via modal</span>
                      <button
                        onClick={() => setShowAddCandidate(election._id)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20"
                      >
                        <Plus className="h-3 w-3" /> Add Candidate
                      </button>
                    </div>
                  )}

                  {election.status === "ACTIVE" && (
                    <div className="mt-4 pt-4 border-t border-slate-800/50 flex items-center gap-2 text-xs text-amber-400/80">
                      <Clock className="h-3 w-3" />
                      <span>Voting in progress</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Pagination Controls for History */}
            {activeTab === "history" && totalHistoryPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                  disabled={historyPage === 1}
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ArrowRight className="h-4 w-4 rotate-180" />
                </button>
                <span className="text-xs text-slate-500">
                  Page <span className="text-slate-200">{historyPage}</span> of {totalHistoryPages}
                </span>
                <button
                  onClick={() => setHistoryPage(p => Math.min(totalHistoryPages, p + 1))}
                  disabled={historyPage === totalHistoryPages}
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
