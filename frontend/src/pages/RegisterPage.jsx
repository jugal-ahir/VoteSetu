import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, User, IdCard, KeyRound, Loader2, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";

export function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = React.useState(1); // 1 = Details, 2 = Aadhar, 3 = OTP
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    voterId: "",
    password: "",
    aadhaarId: "",
    otp: "",
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onDetailsSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/register/pre-check", {
        email: form.email,
        voterId: form.voterId,
      });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Check failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const onAadharSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/register/verify-aadhar", {
        aadhaarId: form.aadhaarId,
        name: form.name,
      });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || "Aadhar verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const onRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await api.post("/auth/register", form);
      setSuccess("Registration and verification successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-5xl flex-col justify-center px-4 lg:flex-row lg:items-center lg:gap-16"
    >
      <div className="mb-10 max-w-md lg:mb-0">
        <div className="mb-6 inline-flex rounded-2xl bg-emerald-500/10 p-3">
          <ShieldCheck className="h-8 w-8 text-emerald-400" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-50 mb-4">
          New Voter Registration
        </h2>
        <p className="text-sm leading-relaxed text-slate-400 mb-8">
          Complete your profile with secure Aadhar-linked identity verification to participate in the democratic process.
        </p>

        <div className="space-y-6">
          {[
            { s: 1, label: "Profile Details", icon: User, desc: "Basic identity information." },
            { s: 2, label: "Aadhar Linkage", icon: IdCard, desc: "Government ID verification." },
            { s: 3, label: "OTP Verification", icon: KeyRound, desc: "Final security handshake." },
          ].map((item) => (
            <div key={item.s} className="flex items-start gap-4">
              <div className={`mt-1 rounded-full p-1.5 transition-colors ${step >= item.s ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-600'}`}>
                <item.icon className="h-4 w-4" />
              </div>
              <div>
                <p className={`text-sm font-semibold transition-colors ${step >= item.s ? 'text-slate-50' : 'text-slate-400'}`}>
                  {item.s} · {item.label}
                </p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-xl transition-all">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-200"
            >
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs font-medium text-emerald-100"
            >
              {success}
            </motion.div>
          )}

          {step === 1 && (
            <form onSubmit={onDetailsSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-slate-400">Full Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  required
                  placeholder="As per certificates"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 outline-none transition-all focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-slate-400">Email</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={onChange}
                    required
                    placeholder="name@ex.com"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 outline-none transition-all focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-slate-400">Voter ID</label>
                  <input
                    name="voterId"
                    value={form.voterId}
                    onChange={onChange}
                    required
                    placeholder="MOCK123"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 outline-none transition-all focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-slate-400">Password</label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={onChange}
                  minLength={8}
                  required
                  placeholder="At least 8 chars"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 outline-none transition-all focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-emerald-600 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-500 hover:shadow-emerald-500/40 disabled:opacity-50"
              >
                {loading ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Checking...</span> : "Confirm Step 1 & Next"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={onAadharSubmit} className="space-y-5">
              <div className="mb-4 rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
                <p className="text-xs text-amber-200">
                  Enter your 12-digit Aadhaar number. For this demo, use <span className="font-mono font-bold text-amber-100">999988887777</span>.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-slate-400">Aadhaar Number</label>
                <input
                  name="aadhaarId"
                  value={form.aadhaarId}
                  onChange={onChange}
                  required
                  pattern="[0-9]{12}"
                  placeholder="0000 0000 0000"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 outline-none transition-all focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-xl border border-slate-700 py-4 text-sm font-bold text-slate-300 transition-all hover:bg-slate-800"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] rounded-xl bg-emerald-600 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-500 hover:shadow-emerald-500/40 disabled:opacity-50"
                >
                  {loading ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</span> : "Request OTP"}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={onRegisterSubmit} className="space-y-6">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                  <KeyRound className="h-8 w-8 text-emerald-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-50">Verification Code Sent</h3>
                <p className="text-xs leading-relaxed text-slate-400">
                  A secure one-time password has been sent to your mobile. <br />
                  <span className="text-amber-400 font-mono">(Demo: Check backend terminal)</span>
                </p>
              </div>

              <div className="space-y-2 text-center">
                <label className="text-xs font-medium uppercase tracking-wider text-slate-400">Enter OTP</label>
                <input
                  name="otp"
                  value={form.otp}
                  onChange={onChange}
                  required
                  placeholder="000000"
                  className="w-full border-b-2 border-slate-700 bg-transparent py-4 text-center text-4xl font-bold tracking-[0.5em] text-emerald-400 outline-none transition-all focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 rounded-xl border border-slate-700 py-4 text-sm font-bold text-slate-300 transition-all hover:bg-slate-800"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] rounded-xl bg-emerald-600 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-500 hover:shadow-emerald-500/40 disabled:opacity-50"
                >
                  {loading ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Finalizing...</span> : "Complete Registration"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </motion.div>
  );
}
