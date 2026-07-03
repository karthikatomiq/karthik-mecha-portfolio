"use client";

import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Corners from "@/components/Corners";
import CardScene from "@/components/three/cards/CardScene";
import OrbitalScene from "@/components/three/cards/OrbitalScene";
import SentinelScene from "@/components/three/cards/SentinelScene";
import NeonCommerceScene from "@/components/three/cards/NeonCommerceScene";
import HypervisorScene from "@/components/three/cards/HypervisorScene";
import type { Project } from "@/data/config";

/* 3D emblem + light accent per unit; greens on 01/03, purples on 02/04 */
const UNIT_EMBLEMS: Record<string, { accent: string; scene: ReactNode }> = {
  "01": { accent: "#B6FF00", scene: <OrbitalScene /> },
  "02": { accent: "#ff003c", scene: <SentinelScene /> },
  "03": { accent: "#B6FF00", scene: <NeonCommerceScene /> },
  "04": { accent: "#a06bc0", scene: <HypervisorScene /> },
};

/**
 * Cyber-Neon project card.
 * - Scroll-linked parallax tilt: flat at viewport center, tilting toward it on
 *   either side (Framer Motion useScroll + useTransform).
 * - Glassmorphism layer with a neon border, glow peaking mid-viewport.
 * - Retains the section-level GSAP wipe reveal via the `.wipe-cover` element.
 */
export default function NeonCard({ project: p }: { project: Project }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Below center → top tilted back; above center → bottom tilted back.
  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [9, 0, -9]);
  const glow = useTransform(scrollYProgress, [0, 0.5, 1], [0.12, 0.55, 0.12]);

  return (
    <motion.article
      ref={ref}
      data-cursor
      style={{ rotateX, transformPerspective: 900 }}
      className="group relative border border-white/10 bg-mecha-purple/20 p-6 transition-colors duration-300 hover:bg-mecha-purple/40 md:p-8"
    >
      {/* Scroll-linked glow: a full-strength border+shadow layer faded via
          opacity, which composites on the GPU — animating box-shadow/border
          colors directly repaints the card every scroll frame. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 border border-neon-cyan"
        style={{
          opacity: glow,
          boxShadow: "0 0 5px rgba(182, 255, 0, 0.7), 0 0 24px rgba(182, 255, 0, 0.4)",
        }}
      />
      {/* Glassmorphism layer — no backdrop-filter: blurring the animated WebGL
          backdrop forces a readback+blur every frame; a denser gradient reads
          the same over the dark starfield at a fraction of the cost. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 border border-neon-cyan/20 bg-gradient-to-br from-mecha-purple/60 via-mecha-purple/25 to-void/40"
      />

      <Corners className="border-white/20 group-hover:border-accent" />

      <div className="mb-6 flex items-center justify-between font-mono text-[10px] tracking-[0.25em] text-white/50">
        <span>UNIT_{p.id}</span>
        <span className="neon-text text-accent/80">◉ {p.status}</span>
      </div>

      {/* visual with wipe reveal */}
      <div className="relative mb-6 aspect-video overflow-hidden border border-white/10">
        <div
          className={`absolute inset-0 bg-gradient-to-br ${p.gradient} transition-transform duration-700 group-hover:scale-105`}
        />
        <span
          aria-hidden
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-jp text-8xl font-black text-white/10 transition-colors duration-500 group-hover:text-accent/20"
        >
          {p.kanji}
        </span>
        {UNIT_EMBLEMS[p.id] && (
          <CardScene accent={UNIT_EMBLEMS[p.id].accent}>{UNIT_EMBLEMS[p.id].scene}</CardScene>
        )}
        <span className="absolute bottom-2 right-3 font-mono text-[9px] tracking-[0.2em] text-white/40">
          {p.codename}
        </span>
        <div className="wipe-cover absolute inset-0 bg-void" />
      </div>

      <h3
        data-text={`[ ${p.name} ]`}
        className="glitch font-display text-lg font-bold tracking-wider md:text-2xl"
      >
        [ {p.name} ]
      </h3>

      <p className="mt-3 text-sm leading-relaxed text-white/60">{p.desc}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {p.tags.map((tag) => (
          <span
            key={tag}
            className="border border-white/15 px-2 py-1 font-mono text-[9px] tracking-[0.2em] text-white/60"
          >
            {tag}
          </span>
        ))}
      </div>

      <a
        href={p.href}
        className="mt-6 inline-flex items-center gap-2 py-2 font-mono text-xs tracking-[0.3em] text-accent transition-colors hover:text-white"
      >
        ACCESS_UNIT
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path d="M2 10L10 2M10 2H4M10 2v6" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </a>
    </motion.article>
  );
}
