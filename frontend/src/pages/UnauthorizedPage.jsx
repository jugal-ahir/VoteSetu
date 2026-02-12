import React from "react";
import { motion } from "framer-motion";
import { Ban } from "lucide-react";
import { Link } from "react-router-dom";

export function UnauthorizedPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-4xl items-center justify-center px-2 sm:px-4"
    >
      <div className="w-full max-w-md rounded-2xl border border-red-500/40 bg-red-900/20 p-6 text-sm shadow-2xl shadow-red-900/40 backdrop-blur">
      <div className="mb-3 flex items-center gap-2">
        <Ban className="h-6 w-6 text-red-400" />
        <div>
          <h2 className="text-lg font-semibold text-slate-50">
            Access Restricted
          </h2>
          <p className="text-xs text-red-200">
            Your request was blocked by the security policy.
          </p>
        </div>
      </div>
      <p className="mb-3 text-xs text-slate-200">
        This may be due to repeated failed logins, suspected OTP brute‑forcing,
        or attempting to vote more than once. All such events are recorded in
        the audit log along with your IP and timestamp.
      </p>
      <Link
        to="/login"
        className="inline-flex rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-800"
      >
        Return to Login
      </Link>
      </div>
    </motion.div>
  );
}


