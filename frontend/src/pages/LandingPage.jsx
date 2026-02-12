import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Lock, Activity, BarChart3, ArrowRight, CheckCircle, Fingerprint } from "lucide-react";
import { Link } from "react-router-dom";

export function LandingPage() {
  return (
    <div className="flex flex-col gap-24 pb-20">
      {/* Hero Section */}
      <section className="relative grid gap-12 lg:grid-cols-2 lg:items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="z-10 space-y-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            Next-Gen E-Voting Prototype
          </div>

          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-6xl">
            The Future of <br />
            <span className="bg-gradient-to-r from-emerald-400 via-primary-400 to-blue-500 bg-clip-text text-transparent">
              Digital Democracy
            </span>
          </h1>

          <p className="max-w-xl text-lg leading-relaxed text-slate-400">
            VoteSetu is a secure, decentralized e-voting ecosystem featuring
            Aadhar-linked identity verification, multi-layer encryption, and
            real-time forensic audit logging.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              to="/register"
              className="group flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-4 font-bold text-white transition-all hover:bg-emerald-500 hover:shadow-[0_0_40px_rgba(16,185,129,0.3)]"
            >
              Get Registered
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/admin"
              className="rounded-xl border border-slate-800 bg-slate-900/50 px-8 py-4 font-bold text-slate-200 transition-all hover:bg-slate-800 hover:text-white"
            >
              Admin Portal
            </Link>
          </div>

          <div className="flex items-center gap-8 pt-4">
            <div className="space-y-1">
              <p className="text-2xl font-bold text-white">256-bit</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">AES Encryption</p>
            </div>
            <div className="h-10 w-px bg-slate-800"></div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-white">Real-time</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Audit Logs</p>
            </div>
            <div className="h-10 w-px bg-slate-800"></div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-white">0.02s</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Verification</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          {/* Abstract decoration */}
          <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-emerald-500/20 to-blue-500/20 blur-2xl" />

          <div className="relative rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
                <Activity className="h-4 w-4 text-emerald-400" />
                Live Election Monitor
              </div>
              <div className="rounded-full bg-slate-950 px-3 py-1 text-[10px] font-bold text-emerald-500 ring-1 ring-emerald-500/30">
                SFC-2026
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-slate-950/50 p-6 ring-1 ring-slate-800">
                  <p className="text-xs font-medium text-slate-500">Ballots Cast</p>
                  <p className="mt-1 text-3xl font-bold text-white">14,208</p>
                </div>
                <div className="rounded-2xl bg-slate-950/50 p-6 ring-1 ring-slate-800">
                  <p className="text-xs font-medium text-slate-500">Integrity Score</p>
                  <p className="mt-1 text-3xl font-bold text-emerald-400">99.9%</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Cryptographic Proof Verifying...</span>
                  <span className="text-emerald-400">Active</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "85%" }}
                    transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-blue-600"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  "RSA-OAEP Key Exchange Protocol",
                  "Aadhar Identity Handshake",
                  "Post-Quantum Readiness Layer"
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs text-slate-400">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="grid gap-8 md:grid-cols-3">
        {[
          {
            title: "Identity Protection",
            desc: "Zero-knowledge proof verification via mock DigiLocker systems.",
            icon: Fingerprint,
            color: "text-blue-400",
            bg: "bg-blue-400/10"
          },
          {
            title: "End-to-End Encrypted",
            desc: "Your vote is sealed at the source and remains encrypted throughout.",
            icon: Lock,
            color: "text-emerald-400",
            bg: "bg-emerald-400/10"
          },
          {
            title: "Tamper Evident",
            desc: "Every interaction is logged in an immutable forensics engine.",
            icon: ShieldCheck,
            color: "text-purple-400",
            bg: "bg-purple-400/10"
          }
        ].map((feat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            viewport={{ once: true }}
            className="group rounded-3xl border border-slate-800 bg-slate-900/30 p-8 transition-all hover:bg-slate-900/50 hover:shadow-2xl hover:shadow-emerald-500/5"
          >
            <div className={`mb-6 inline-flex rounded-2xl ${feat.bg} p-3 ${feat.color}`}>
              <feat.icon className="h-6 w-6" />
            </div>
            <h3 className="mb-3 text-xl font-bold text-white">{feat.title}</h3>
            <p className="text-sm leading-relaxed text-slate-400">{feat.desc}</p>
          </motion.div>
        ))}
      </section>
    </div>
  );
}


