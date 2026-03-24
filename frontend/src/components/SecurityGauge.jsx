import React from "react";
import { motion } from "framer-motion";

export function SecurityGauge({ score = 0, size = 200 }) {
  const strokeWidth = 15;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s) => {
    if (s < 50) return "#ef4444"; // red-500
    if (s < 80) return "#f59e0b"; // amber-500
    return "#10b981"; // emerald-500
  };

  const color = getColor(score);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-800"
        />
        {/* Progress Fill */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeLinecap="round"
        />
      </svg>
      {/* Center Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-black text-white"
        >
          {Math.round(score)}%
        </motion.span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Security Health
        </span>
      </div>
    </div>
  );
}
