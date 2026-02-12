import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Download, Printer, CheckCircle2, FileText } from "lucide-react";
import { useLocation, Link } from "react-router-dom";

export function VoteSuccessPage() {
  const location = useLocation();
  // Fallback data if accessed directly
  const receiptData = location.state || {
    electionName: "General Election",
    timestamp: new Date().toISOString(),
    hash: "SAMPLE-HASH-XC90-23N2-32KB-23N2",
    transactionId: "TXN-" + Math.random().toString(36).substr(2, 9).toUpperCase()
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadTxt = () => {
    const content = `
VOTESETU OFFICIAL VOTE RECEIPT
--------------------------------
Election: ${receiptData.electionName}
Time: ${new Date(receiptData.timestamp).toLocaleString()}
Transaction ID: ${receiptData.transactionId}
Verification Hash: ${receiptData.hash}
--------------------------------
This document certifies that a secure, encrypted vote 
was cast and recorded on the VoteSetu immutable ledger.
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `VoteReceipt-${receiptData.transactionId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="overflow-hidden rounded-3xl border border-emerald-500/30 bg-slate-900/60 shadow-2xl backdrop-blur-xl"
      >
        <div className="bg-emerald-600/10 p-8 text-center border-b border-emerald-500/20">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 ring-4 ring-emerald-500/10">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">Vote Successfully Cast</h1>
          <p className="mt-2 text-emerald-200/80">
            Your ballot has been encrypted and recorded.
          </p>
        </div>

        <div className="p-8 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-6">
            <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
              <ShieldCheck className="h-4 w-4" /> Official Digital Receipt
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between border-b border-slate-800 pb-3">
                <span className="text-sm text-slate-400">Election Event</span>
                <span className="text-sm font-semibold text-white">{receiptData.electionName || "Unknown Election"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-3">
                <span className="text-sm text-slate-400">Date & Time</span>
                <span className="text-sm font-mono text-slate-300">
                  {new Date(receiptData.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-3">
                <span className="text-sm text-slate-400">Transaction ID</span>
                <span className="text-sm font-mono text-slate-300">{receiptData.transactionId || "Pending"}</span>
              </div>
              <div>
                <span className="text-sm text-slate-400 block mb-2">Cryptographic Hash</span>
                <div className="break-all rounded bg-slate-900 p-3 font-mono text-xs text-emerald-500 border border-slate-800">
                  {receiptData.hash || "Hash generation pending..."}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleDownloadTxt}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-6 py-3 font-semibold text-white transition-all hover:bg-slate-700 flex-1"
            >
              <Download className="h-4 w-4" /> Save Receipt
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-900/20 transition-all hover:bg-emerald-500 flex-1"
            >
              <Printer className="h-4 w-4" /> Print
            </button>
          </div>

          <div className="text-center pt-4">
            <Link to="/vote" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">
              Return to Voting Booth
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
