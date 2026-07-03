"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useIsFinePointer } from "@/hooks/useIsFinePointer";

/**
 * Targeting reticle that replaces the native cursor.
 * Snaps, rotates 45° and inverts (mix-blend-difference) over interactive targets.
 */
export default function CustomCursor() {
  const fine = useIsFinePointer();
  const [locked, setLocked] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 900, damping: 60, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 900, damping: 60, mass: 0.4 });

  useEffect(() => {
    if (!fine) return;
    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    const over = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      setLocked(!!t?.closest("a, button, input, textarea, [data-cursor]"));
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
    };
  }, [fine, x, y]);

  if (!fine) return null;

  const corner = "absolute h-2 w-2 transition-colors duration-200";
  const stroke = locked ? "border-white" : "border-accent";

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[999] mix-blend-difference"
      style={{ x: sx, y: sy }}
    >
      <div className="-translate-x-1/2 -translate-y-1/2">
        <motion.div
          className="relative h-8 w-8"
          animate={{ rotate: locked ? 45 : 0, scale: locked ? 1.35 : 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 22 }}
        >
          <span className={`${corner} ${stroke} left-0 top-0 border-l border-t`} />
          <span className={`${corner} ${stroke} right-0 top-0 border-r border-t`} />
          <span className={`${corner} ${stroke} bottom-0 left-0 border-b border-l`} />
          <span className={`${corner} ${stroke} bottom-0 right-0 border-b border-r`} />
          <span
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ${
              locked ? "h-1.5 w-1.5 bg-white" : "h-1 w-1 rounded-full bg-accent"
            }`}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
