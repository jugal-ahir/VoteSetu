import React from "react";
import { motion } from "framer-motion";
import { KeyRound, ShieldCheck, UserCheck, Lock } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuthStore } from "../store/authStore.js";

export function LoginPage() {
  const [step, setStep] = React.useState(1); // 1 = credentials, 2 = OTP
  const [form, setForm] = React.useState({ voterId: "", password: "", otp: "", captcha: "" });
  const [loading, setLoading] = React.useState(false);
  const [captchaUrl, setCaptchaUrl] = React.useState(null);
  const [error, setError] = React.useState("");
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [searchParams] = useSearchParams();

  React.useEffect(() => {
    if (searchParams.get("session") === "expired") {
      setError("Your session has expired. Please login again.");
    }
    fetchCaptcha();
  }, [searchParams]);

  const fetchCaptcha = async () => {
    try {
      const res = await api.get("/auth/captcha");
      setCaptchaUrl(res.data); // This will be the SVG string
    } catch (err) {
      console.error("Failed to fetch captcha", err);
    }
  };

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/login", {
        voterId: form.voterId,
        password: form.password,
        captcha: form.captcha,
      });
      setStep(2);
    } catch (err) {
      const status = err.response?.status;
      const msg =
        err.response?.data?.message || "Login failed. Please try again.";
      setError(msg);
      if (status === 423 || status === 403) {
        navigate("/unauthorized");
      }
    } finally {
      setLoading(false);
    }
  };

  const onOtpSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/verify-otp", {
        voterId: form.voterId,
        otp: form.otp,
      });
      const { token, user } = res.data;
      setAuth(user, token);

      if (user.role === "admin") {
        navigate("/admin");
      } else {
        if (user.digilockerStatus === "VERIFIED") {
          navigate("/vote");
        } else {
          navigate("/digilocker");
        }
      }
    } catch (err) {
      const status = err.response?.status;
      const msg =
        err.response?.data?.message || "OTP verification failed. Try again.";
      setError(msg);
      if (status === 423 || status === 403) {
        navigate("/unauthorized");
      }
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
          <KeyRound className="h-8 w-8 text-emerald-400" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-50 mb-4">
          Secure Multi‑Factor Login
        </h2>
        <p className="text-sm leading-relaxed text-slate-400 mb-8">
          To ensure the integrity of the voting process, we use password
          authentication followed by a one‑time verification code.
        </p>

        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className={`mt-1 rounded-full p-1.5 transition-colors ${step >= 1 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-600'}`}>
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <p className={`text-sm font-semibold ${step === 1 ? 'text-slate-50' : 'text-slate-400'}`}>1 · Credentials</p>
              <p className="text-xs text-slate-500">Voter ID and secure password.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className={`mt-1 rounded-full p-1.5 transition-colors ${step >= 2 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-600'}`}>
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <p className={`text-sm font-semibold ${step === 2 ? 'text-slate-50' : 'text-slate-400'}`}>2 · OTP Verification</p>
              <p className="text-xs text-slate-500">Six-digit code sent to your device.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 opacity-50">
            <div className={`mt-1 rounded-full p-1.5 bg-slate-800 text-slate-600`}>
              <UserCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">3 · DigiLocker</p>
              <p className="text-xs text-slate-600 italic">Required only for unverified profiles.</p>
            </div>
          </div>
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

          {step === 1 ? (
            <form onSubmit={onCredentialsSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-slate-400">Voter ID or Email</label>
                <input
                  name="voterId"
                  value={form.voterId}
                  onChange={onChange}
                  required
                  placeholder="Enter your ID"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 outline-none transition-all focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-slate-400">Security Password</label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={onChange}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 outline-none transition-all focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium uppercase tracking-wider text-slate-400">Verification CAPTCHA</label>
                  <button
                    type="button"
                    onClick={fetchCaptcha}
                    className="text-[10px] text-emerald-500 hover:text-emerald-400 font-bold uppercase transition-colors"
                  >
                    Refresh
                  </button>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 rounded-xl border border-slate-700 bg-slate-950/50 p-2 flex items-center justify-center overflow-hidden h-14">
                    {captchaUrl ? (
                      <div 
                        dangerouslySetInnerHTML={{ __html: captchaUrl }} 
                        className="w-full h-full flex items-center justify-center [&_svg]:max-w-full [&_svg]:h-auto !scale-90"
                      />
                    ) : (
                      <div className="animate-pulse flex items-center justify-center text-[10px] text-slate-600 uppercase font-black tracking-widest bg-slate-800/20 w-full h-8 rounded-lg">
                        Generating...
                      </div>
                    )}
                  </div>
                  <input
                    name="captcha"
                    value={form.captcha}
                    onChange={onChange}
                    required
                    maxLength={6}
                    placeholder="Code"
                    className="w-24 rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-center text-sm font-bold text-slate-100 outline-none transition-all focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="mt-4 w-full rounded-xl bg-emerald-600 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-500 hover:shadow-emerald-500/40 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Authenticating...
                  </span>
                ) : "Sign In & Request OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={onOtpSubmit} className="space-y-6">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                  <ShieldCheck className="h-8 w-8 text-emerald-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-50">Check your Email</h3>
                <p className="text-xs leading-relaxed text-slate-400">
                  We&apos;ve sent a simulation code to your registered email for demo purposes.
                </p>
              </div>

              <div className="space-y-2 text-center">
                <label className="text-xs font-medium uppercase tracking-wider text-slate-400">Enter 6-Digit Code</label>
                <input
                  name="otp"
                  value={form.otp}
                  onChange={onChange}
                  required
                  placeholder="000000"
                  className="w-full border-b-2 border-slate-700 bg-transparent py-4 text-center text-4xl font-bold tracking-[0.5em] text-emerald-400 outline-none transition-all focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-emerald-600 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-500 hover:shadow-emerald-500/40 disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify & Continue"}
              </button>
            </form>
          )}

          <p className="mt-8 text-center text-[11px] text-slate-600">
            Protected by BoatSetu Shield · Academic Demo Environment
          </p>
        </div>
      </div>
    </motion.div>
  );
}


