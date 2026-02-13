import React from "react";
import { motion } from "framer-motion";
import { Logo } from "./Logo.jsx";

export function GlobalLoader() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950"
        >
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                    scale: [0.8, 1, 0.95, 1],
                    opacity: [0, 1, 1, 1]
                }}
                transition={{
                    duration: 2,
                    times: [0, 0.3, 0.6, 1],
                    ease: "easeInOut"
                }}
                className="flex flex-col items-center gap-6"
            >
                <Logo className="h-24 w-24" />
                <motion.div
                    animate={{
                        opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="text-sm font-medium tracking-wider text-slate-400"
                >
                    Loading VoteSetu...
                </motion.div>
            </motion.div>
        </motion.div>
    );
}
