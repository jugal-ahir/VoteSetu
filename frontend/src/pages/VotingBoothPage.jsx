import React from "react";
import { motion } from "framer-motion";
import { Vote, ShieldCheck, AlertTriangle, User, Loader2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuthStore } from "../store/authStore.js";
import { ConfirmModal } from "../components/ConfirmModal.jsx";

export function VotingBoothPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const [candidates, setCandidates] = React.useState([]);
  const [activeElection, setActiveElection] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [voting, setVoting] = React.useState(false);
  const [error, setError] = React.useState("");

  // Modal State
  const [modal, setModal] = React.useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: () => { },
  });

  React.useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get("/votes/active");
      setActiveElection(res.data.election);
      setCandidates(res.data.candidates);
    } catch (err) {
      console.error(err);
      setError("Failed to load ballot data.");
    } finally {
      setLoading(false);
    }
  };

  const initiateVote = (candidateId) => {
    setModal({
      isOpen: true,
      title: "Confirm Your Vote",
      message: "Are you sure you want to cast your vote for this candidate? This action cannot be undone.",
      type: "info",
      confirmText: "Cast Vote",
      onConfirm: () => handleVote(candidateId),
    });
  };

  const handleVote = async (candidateId) => {
    setVoting(true);
    try {
      const res = await api.post("/votes/cast", {
        electionId: activeElection._id,
        candidateId,
      });
      navigate("/vote/success", {
        state: {
          electionName: activeElection.name,
          timestamp: new Date().toISOString(),
          hash: res.data.receiptHash,
          transactionId: res.data.voteId
        }
      });
    } catch (err) {
      setModal({
        isOpen: true,
        title: "Vote Failed",
        message: err.response?.data?.message || "An error occurred while casting your vote.",
        type: "danger",
        confirmText: "Close",
        onConfirm: () => { },
      });
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-6rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!activeElection) {
    return (
      <div className="flex h-[calc(100vh-6rem)] flex-col items-center justify-center text-center px-4">
        <div className="rounded-full bg-slate-800/50 p-6 backdrop-blur-sm">
          <AlertTriangle className="h-12 w-12 text-amber-500" />
        </div>
        <h2 className="mt-6 text-2xl font-bold text-slate-100">No Active Election</h2>
        <p className="mt-2 text-slate-400 max-w-md">
          There are currently no elections open for voting. Please check back later or contact the election commission.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <ConfirmModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        {...modal}
      />

      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-center"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Live Ballot
        </div>
        <h1 className="text-4xl font-bold text-white md:text-5xl lg:text-6xl tracking-tight">
          {activeElection.name}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
          {activeElection.description}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          {/* Dynamic Identity Badge */}
          <div className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider backdrop-blur-md ${user?.digilockerStatus === "VERIFIED"
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            : "border-amber-500/30 bg-amber-500/10 text-amber-400"
            }`}>
            {user?.digilockerStatus === "VERIFIED" ? <ShieldCheck className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            Identity Status: {user?.digilockerStatus || "PENDING"}
          </div>

          <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 backdrop-blur-md">
            <Vote className="h-4 w-4" />
            Secure Session Active
          </div>
        </div>
      </motion.div>

      {/* Candidates Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {candidates.map((candidate, idx) => (
          <motion.div
            key={candidate._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/40 p-1 transition-all hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-900/20"
          >
            {/* Hover Gradient Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/0 via-emerald-600/0 to-emerald-600/5 transition-opacity opacity-0 group-hover:opacity-100" />

            <div className="relative flex h-full flex-col rounded-[1.3rem] bg-slate-950/50 p-6 backdrop-blur-sm">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-slate-300 shadow-inner group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
                <User className="h-8 w-8" />
              </div>

              <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                {candidate.name}
              </h3>
              <p className="mt-1 text-sm font-medium text-slate-400 uppercase tracking-wide">
                {candidate.party}
              </p>

              <div className="my-6 h-px w-full bg-slate-800" />

              <p className="mb-8 flex-grow text-sm leading-relaxed text-slate-400">
                {candidate.manifesto}
              </p>

              <button
                onClick={() => initiateVote(candidate._id)}
                disabled={voting}
                className="w-full rounded-xl bg-slate-800 py-3 text-sm font-bold text-white transition-all hover:bg-emerald-600 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 group-hover:bg-emerald-600"
              >
                {voting ? "Authenticating Vote..." : "Cast Secure Vote"}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
