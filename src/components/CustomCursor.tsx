"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useIsFinePointer } from "@/hooks/useIsFinePointer";

/**
 * Multi-layered Mecha targeting crosshair replacing the native cursor.
 * Three independently-driven layers create a sense of depth: the core dot
 * tracks the raw mouse position with zero lag, while the inner ring and
 * outer radar each ease toward it on their own spring — the radar trailing
 * looser than the ring — and the radar spins continuously via a plain CSS
 * animation, fully decoupled from mouse movement.
 *
 * Each layer bakes its centering offset (-50%, -50%) into the same
 * transform framer-motion writes for x/y (via transformTemplate) so every
 * position:fixed element carries centering + tracking in one transform,
 * rather than needing a separate wrapper per layer.
 */
const CORE_SIZE = 8;
const RING_SIZE = 36;
const RADAR_SIZE = 55;
const ACCENT = "#B6FF00";
const RADAR_PURPLE = "#7209B7";

const LAYER_CLASS = "pointer-events-none fixed left-0 top-0 z-[9999]";

export default function CustomCursor() {
  const fine = useIsFinePointer();

  /* Layer 1 (core): raw mouse position, no smoothing. */
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);

  /* Layer 2 (inner ring): tight spring, catches up quickly. */
  const ringX = useSpring(x, { stiffness: 500, damping: 40, mass: 0.5 });
  const ringY = useSpring(y, { stiffness: 500, damping: 40, mass: 0.5 });

  /* Layer 3 (outer radar): looser spring, trails visibly further behind. */
  const radarX = useSpring(x, { stiffness: 180, damping: 26, mass: 0.9 });
  const radarY = useSpring(y, { stiffness: 180, damping: 26, mass: 0.9 });

  useEffect(() => {
    if (!fine) return;
    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [fine, x, y]);

  if (!fine) return null;

  return (
    <>
      {/* Layer 1 — Core: instant, zero-lag dot */}
      <motion.div
        aria-hidden
        className={`${LAYER_CLASS} rounded-full`}
        style={{
          x,
          y,
          width: CORE_SIZE,
          height: CORE_SIZE,
          background: ACCENT,
          boxShadow: `0 0 12px 2px ${ACCENT}`,
        }}
        transformTemplate={(_, generated) => `translate(-50%, -50%) ${generated}`}
      />

      {/* Layer 2 — Inner ring: tight spring lag */}
      <motion.div
        aria-hidden
        className={`${LAYER_CLASS} rounded-full`}
        style={{
          x: ringX,
          y: ringY,
          width: RING_SIZE,
          height: RING_SIZE,
          border: `3px solid ${ACCENT}`,
          background: "transparent",
          boxShadow: "0 0 18px rgba(182, 255, 0, 0.5), inset 0 0 12px rgba(182, 255, 0, 0.3)",
        }}
        transformTemplate={(_, generated) => `translate(-50%, -50%) ${generated}`}
      />

      {/* Layer 3 — Outer radar: loose spring lag + independent continuous spin */}
      <motion.div
        aria-hidden
        className={LAYER_CLASS}
        style={{ x: radarX, y: radarY, width: RADAR_SIZE, height: RADAR_SIZE }}
        transformTemplate={(_, generated) => `translate(-50%, -50%) ${generated}`}
      >
        <div
          className="reticle-radar-spin absolute inset-0 rounded-full"
          style={{ border: `3px dashed ${RADAR_PURPLE}` }}
        >
          <span className="reticle-notch" style={{ top: -3, left: "50%", marginLeft: -1 }} />
          <span className="reticle-notch" style={{ bottom: -3, left: "50%", marginLeft: -1 }} />
          <span className="reticle-notch reticle-notch-v" style={{ left: -3, top: "50%", marginTop: -1 }} />
          <span className="reticle-notch reticle-notch-v" style={{ right: -3, top: "50%", marginTop: -1 }} />
        </div>
      </motion.div>
    </>
  );
}
