import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IdCard, ShieldCheck, CheckCircle2, Info, Loader2, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";

export function DigiLockerPage() {
  const navigate = useNavigate();
  const [step, setStep] = React.useState(1); // 1 = input aadhaar, 2 = verify otp
  const [form, setForm] = React.useState({
    aadhaar: "",
    otp: "",
    consent: false,
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const onRequestOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/digilocker/request-otp", {
        aadhaarId: form.aadhaar
      });
      setSuccess("OTP sent to your Aadhaar-linked mobile.");
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to find Aadhaar record.");
    } finally {
      setLoading(false);
    }
  };

  const onVerifySubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await api.post("/digilocker/verify", {
        aadhaarId: form.aadhaar,
        otp: form.otp,
        consent: form.consent,
      });
      setSuccess("Identity verified with DigiLocker. Securely proceeding...");
      setTimeout(() => navigate("/vote", { state: { digi: res.data } }), 1000);
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-5xl flex-col items-center justify-center px-4"
    >
      <div className="mb-12 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
          <IdCard className="h-8 w-8 text-emerald-400" />
        </div>
        <h2 className="text-3xl font-bold text-slate-50">Identity Handshake</h2>
        <p className="mt-2 text-slate-400">Step 3: Secure Identity Verification via DigiLocker</p>
      </div>

      <div className="grid w-full gap-8 lg:grid-cols-2 lg:items-start">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-amber-500/10 p-2">
                <Info className="h-5 w-5 text-amber-400" />
              </div>
              <p className="text-sm font-semibold text-slate-100">Academic Disclaimer</p>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              This system simulates a connection to the Govt. of India's DigiLocker API.
              Use Aadhaar <span className="text-emerald-400 font-mono">999988887777</span> for the demo.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-500" />
              <p className="text-xs text-slate-400">256-bit SSL encrypted communication</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-500" />
              <p className="text-xs text-slate-400">Biometric-ready handshake protocol</p>
            </div>
            <div className="flex items-start gap-3 text-slate-500">
              <ShieldCheck className="h-4 w-4 mt-0.5" />
              <p className="text-xs">Compliant with National Data Privacy Standards</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-200"
              >
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs font-medium text-emerald-100"
              >
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          {step === 1 ? (
            <motion.form
              key="step1"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onSubmit={onRequestOtp} className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Aadhaar Number (12 Digits)
                </label>
                <input
                  name="aadhaar"
                  value={form.aadhaar}
                  onChange={onChange}
                  pattern="\\d{12}"
                  required
                  placeholder="0000 0000 0000"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 outline-none transition-all focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/30 p-4 transition-colors hover:bg-slate-950/50">
                <input
                  type="checkbox"
                  name="consent"
                  checked={form.consent}
                  onChange={onChange}
                  className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/20"
                />
                <span className="text-xs leading-relaxed text-slate-400">
                  I authorize DigiLocker to share my identity data with the Election Commission.
                </span>
              </label>

              <button
                type="submit"
                disabled={!form.consent || loading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-500 hover:shadow-emerald-500/40 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Request OTP <Send className="h-4 w-4" /></>}
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="step2"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              onSubmit={onVerifySubmit} className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Verification Code (OTP)
                </label>
                <input
                  name="otp"
                  value={form.otp}
                  onChange={onChange}
                  required
                  placeholder="••••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-center text-4xl font-bold tracking-[0.5em] text-emerald-400 outline-none transition-all focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10"
                />
                <p className="text-[10px] text-center text-slate-500">Check server console for simulated OTP</p>
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
                  {loading ? "Verifying..." : "Authorize"}
                </button>
              </div>
            </motion.form>
          )}
        </div>
      </div>
    </motion.div>
  );
}


