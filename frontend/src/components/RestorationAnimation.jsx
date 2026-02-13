import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const Grid = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
        <div
            className="absolute inset-0"
            style={{
                backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
                backgroundSize: '40px 40px'
            }}
        />
    </div>
);

const Line = ({ y, delay }) => (
    <motion.div
        className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent"
        style={{ top: `${y}%` }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: [0, 1, 0] }}
        transition={{ duration: 2, delay, repeat: Infinity }}
    />
);

const PulseNode = ({ x, y, delay }) => (
    <div className="absolute" style={{ left: `${x}%`, top: `${y}%` }}>
        <motion.div
            className="w-1.5 h-1.5 bg-cyan-400 rounded-full"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0.5] }}
            transition={{ duration: 1, delay }}
        />
        <motion.div
            className="absolute inset-0 w-1.5 h-1.5 border border-cyan-400 rounded-full"
            animate={{ scale: [1, 4], opacity: [0.5, 0] }}
            transition={{ duration: 2, delay, repeat: Infinity }}
        />
    </div>
);

export const RestorationAnimation = ({ isVisible }) => {
    const nodes = React.useMemo(() => [
        { x: 20, y: 30 }, { x: 50, y: 20 }, { x: 80, y: 35 },
        { x: 30, y: 60 }, { x: 60, y: 70 }, { x: 15, y: 75 },
        { x: 85, y: 65 }, { x: 45, y: 45 }
    ], []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }} // Fast entry
                    className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-slate-950/98 backdrop-blur-xl"
                >
                    <Grid />

                    {/* Minimalist Data Reconstruction Visual */}
                    <div className="relative w-full max-w-lg h-64 mb-16 px-8">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Line key={i} y={20 + i * 15} delay={i * 0.4} />
                        ))}
                        {nodes.map((n, i) => (
                            <PulseNode key={i} x={n.x} y={n.y} delay={i * 0.1} />
                        ))}

                        {/* Central Scanning Core */}
                        <motion.div
                            className="absolute inset-y-0 w-[2px] bg-gradient-to-b from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_rgba(34,211,238,0.5)]"
                            initial={{ left: "0%" }}
                            animate={{ left: "100%" }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        />
                    </div>

                    <div className="relative z-20 text-center space-y-8">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <span className="text-[10px] font-mono tracking-[0.5em] text-cyan-500/80 uppercase block mb-4">
                                Secure_State_Reconstruction
                            </span>
                            <h2 className="text-4xl font-extralight text-white tracking-tight">
                                Restoring <span className="font-semibold text-cyan-400">Data Integrity</span>
                            </h2>
                        </motion.div>

                        <div className="flex flex-col items-center gap-6">
                            <div className="w-72 h-[1px] bg-slate-800 relative overflow-hidden">
                                <motion.div
                                    className="absolute inset-y-0 left-0 bg-cyan-500 shadow-[0_0_15px_#06b6d4]"
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 3.5, ease: "easeInOut" }}
                                />
                            </div>

                            <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-widest text-slate-500">
                                <span className="animate-pulse">Analyzing Snapshots</span>
                                <span className="text-slate-700">|</span>
                                <span className="animate-pulse" style={{ animationDelay: '0.5s' }}>Rebuilding BSON Types</span>
                                <span className="text-slate-700">|</span>
                                <span className="animate-pulse" style={{ animationDelay: '1s' }}>Verifying Checksum</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
