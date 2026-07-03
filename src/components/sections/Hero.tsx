"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import ParallaxKanji from "@/components/ParallaxKanji";
import { siteConfig } from "@/data/config";

const LETTER_EASE = [0.16, 1, 0.3, 1] as const;

export default function Hero({ booted }: { booted: boolean }) {
  const reduceMotion = useReducedMotion();
  const [typed, setTyped] = useState("");
  const doneTyping = typed.length >= siteConfig.role.length;

  // Terminal typing effect for the subtitle, starts once the preloader opens.
  useEffect(() => {
    if (!booted) return;
    if (reduceMotion) {
      setTyped(siteConfig.role);
      return;
    }
    let i = 0;
    let interval: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        i += 1;
        setTyped(siteConfig.role.slice(0, i));
        if (i >= siteConfig.role.length) clearInterval(interval);
      }, 42);
    }, 900);
    return () => {
      clearTimeout(start);
      clearInterval(interval);
    };
  }, [booted, reduceMotion]);

  return (
    <section id="top" className="relative flex min-h-dvh flex-col justify-center overflow-hidden px-6 md:px-12">
      {/* 開発者 = Developer */}
      <ParallaxKanji className="right-[4vw] top-[10vh] text-[38vh] leading-none text-stroke" speed={-30}>
        開発者
      </ParallaxKanji>

      {/* meta readouts */}
      <motion.div
        className="absolute left-6 top-24 font-mono text-[10px] leading-loose tracking-[0.25em] text-white/40 md:left-12"
        initial={{ opacity: 0 }}
        animate={booted ? { opacity: 1 } : {}}
        transition={{ delay: 1.2, duration: 0.8 }}
      >
        <p>UNIT: DEV-01 <span className="text-accent">◉ SYNCED</span></p>
        <p>PILOT: {siteConfig.name.toUpperCase()}</p>
        <p>FIELD: FULL-STACK / DEVOPS</p>
      </motion.div>

      {/* staggered name reveal */}
      <h1 aria-label={siteConfig.displayName} className="relative z-10 flex flex-wrap neon-outline-purple">
        {siteConfig.displayName.split("").map((letter, i) => (
          <span key={i} aria-hidden className="inline-block overflow-hidden">
            <motion.span
              className="inline-block font-display text-[11.5vw] font-bold leading-[1.05] md:text-[12vw]"
              initial={{ y: "115%" }}
              animate={booted ? { y: "0%" } : {}}
              transition={{ duration: 1.1, delay: 0.05 + i * 0.06, ease: [...LETTER_EASE] }}
            >
              {letter}
            </motion.span>
          </span>
        ))}
      </h1>

      {/* typed subtitle */}
      <motion.p
        className="z-10 mt-6 font-mono text-sm tracking-[0.2em] text-white/80 md:text-base"
        initial={{ opacity: 0 }}
        animate={booted ? { opacity: 1 } : {}}
        transition={{ delay: 0.8 }}
      >
        <span className="text-accent">&gt;_ </span>
        {typed}
        <span className={`ml-1 inline-block h-4 w-2 translate-y-0.5 bg-accent ${doneTyping ? "animate-blink" : ""}`} />
      </motion.p>

      {/* scroll prompt */}
      <motion.div
        className="absolute bottom-10 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3"
        initial={{ opacity: 0 }}
        animate={booted ? { opacity: 1 } : {}}
        transition={{ delay: 2, duration: 1 }}
      >
        <span className="font-mono text-[10px] tracking-[0.4em] text-white/50">
          SCROLL TO INITIATE <span className="text-accent">LINK_START</span>
        </span>
        <motion.svg
          width="14"
          height="18"
          viewBox="0 0 14 18"
          fill="none"
          animate={reduceMotion ? undefined : { y: [0, 7, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M7 1v14M2 10l5 6 5-6" stroke="#B6FF00" strokeWidth="1.2" />
        </motion.svg>
      </motion.div>
    </section>
  );
}
