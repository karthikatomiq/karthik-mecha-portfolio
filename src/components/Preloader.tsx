"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

type Phase = "boot" | "open" | "done";

/**
 * Clean boot sequence: percentage counter -> full-screen fade-out.
 * `onComplete` fires once the fade-out starts.
 */
export default function Preloader({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<Phase>("boot");
  const fired = useRef(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const tick = setInterval(() => {
      setProgress((p) => Math.min(100, p + Math.random() * 9 + 3));
    }, 55);
    return () => {
      clearInterval(tick);
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (progress < 100 || fired.current) return;
    fired.current = true;
    const t1 = setTimeout(() => {
      setPhase("open");
      document.body.style.overflow = "";
      onComplete();
    }, 250);
    const t2 = setTimeout(() => setPhase("done"), 1200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [progress, onComplete]);

  if (phase === "done") return null;

  const open = phase === "open";
  const pct = String(Math.floor(progress)).padStart(3, "0");

  return (
    <motion.div
      className={`fixed inset-0 z-[100] bg-void flex flex-col justify-between p-6 md:p-10 ${open ? "pointer-events-none" : ""}`}
      aria-hidden
      initial={{ opacity: 1 }}
      animate={{ opacity: open ? 0 : 1 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      {/* boot readout */}
      <div className="flex items-start justify-between font-mono text-[10px] tracking-[0.3em] text-white/50">
        <span>KARTHIK://OS</span>
        <span className="text-accent">起動中 — BOOTING</span>
      </div>
      <div className="flex items-end justify-between">
        <div className="font-mono text-[10px] leading-relaxed tracking-[0.2em] text-white/40">
          <p>&gt; MOUNTING /dev/domain</p>
          <p>&gt; INJECTING CURSED_ENERGY.pkg</p>
          <p className="text-accent/80">&gt; LINK_START IMMINENT</p>
        </div>
        <p className="font-display text-6xl font-bold tabular-nums text-white md:text-8xl">
          {pct}
          <span className="text-accent">%</span>
        </p>
      </div>
    </motion.div>
  );
}
