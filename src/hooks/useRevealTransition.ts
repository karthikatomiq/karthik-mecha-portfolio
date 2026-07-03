"use client";

import { useEffect } from "react";
import { useAnimate, useReducedMotion } from "framer-motion";
import { markBooted } from "@/lib/boot";

/**
 * Blast-door reveal that hands off from the loading screen to the hero.
 * Attach the returned scope to the loading screen root; when `active`
 * flips true the timeline runs: impact flash -> boot UI glitches out ->
 * door panels part (hero entrance fires underneath via markBooted) ->
 * camera settle -> onComplete. Chained framer `animate` calls, so beat
 * timings live in one place. ~0.9s to open, fully settled ~1.6s.
 */
export function useRevealTransition(active: boolean, onComplete: () => void) {
  const [scope, animate] = useAnimate();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!active || !scope.current) return;

    if (reduceMotion) {
      markBooted();
      onComplete();
      return;
    }

    let cancelled = false;
    const run = async () => {
      /* 1 — impact flash with an RGB-split jitter on the boot UI */
      animate(".ls-flash-el", { opacity: [0, 1, 0] }, { duration: 0.13, ease: "easeOut" });
      await animate(".ls-ui", { x: [0, -7, 6, -3, 0] }, { duration: 0.13, ease: "linear" });
      if (cancelled) return;

      /* 2 — boot UI (counter, scanlines, readouts) glitches out */
      await animate(".ls-ui", { opacity: 0, x: [0, 4, -3, 0] }, { duration: 0.18, ease: "easeOut" });
      if (cancelled) return;

      /* 3 — doors part; the hero's booted-gated entrance starts under them.
         The emblem pops in between the parting doors, holds a beat, and
         dissolves before the doors finish so it never clashes with the
         hero's own entrance. */
      markBooted();

      /* Camera settle on the page content. WAAPI (fill: none) so no
         transform lingers on <main> — a persistent one would re-parent
         the position:fixed pin GSAP puts inside it for the About section. */
      document.querySelector("main")?.animate(
        [
          { transform: "scale(1.045)", transformOrigin: "50% 35%" },
          { transform: "scale(1)", transformOrigin: "50% 35%" },
        ],
        { duration: 750, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      );

      const doorsDone = Promise.all([
        animate(".ls-door-l", { x: "-101%" }, { duration: 0.55, ease: [0.76, 0, 0.24, 1] }),
        animate(".ls-door-r", { x: "101%" }, { duration: 0.55, ease: [0.76, 0, 0.24, 1] }),
      ]);

      /* Climax: the emblem that presided over the boot swells slightly and
         dissolves while the doors part — awaited, so the overlay never
         tears down with it still visible. */
      await animate(".ls-symbol", { scale: 1.12, opacity: 0 }, { duration: 0.4, ease: "easeIn" });
      if (cancelled) return;

      await doorsDone;
      if (cancelled) return;

      onComplete();
    };
    run();

    return () => {
      cancelled = true;
    };
    // animate/scope are stable; onComplete must be memoized by the caller
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, reduceMotion]);

  return scope;
}
