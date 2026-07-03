"use client";

import { useEffect } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { getLenis } from "@/lib/scroll";

// Only the vertical (left/right) edges get a streak. Sections stack directly
// on top of each other in normal flow, so the top/bottom edges of one
// section sit exactly on the bottom/top edge of its neighbor — animating
// those doubles up into a stray line right at the section boundary while
// scrolling past it. Left/right edges never abut another section, so they
// stay visually contained to the section that owns them.
const EDGES = ["right", "left"] as const;
type Edge = (typeof EDGES)[number];

/** 2px strips positioned on each side of the section, revealed via clip-path. */
const EDGE_STYLE: Record<Edge, Partial<CSSStyleDeclaration>> = {
  right: { top: "0", right: "0", bottom: "0", width: "2px", clipPath: "inset(0 0 100% 0)" },
  left: { top: "0", left: "0", bottom: "0", width: "2px", clipPath: "inset(100% 0 0 0)" },
};

/**
 * Electric Scroll engine:
 * 1. Scrub-linked hue-rotate/brightness on each section as it crosses the viewport.
 * 2. "Neon Streak" — onEnter, a timeline draws a 2px neon border clockwise around
 *    the section perimeter via clip-path.
 * 3. Scroll velocity (from Lenis) drives `--neon-spread`, so every .neon-glow /
 *    hover glow widens as the user scrolls faster.
 *
 * Everything (ScrollTriggers, timelines, injected DOM, ticker) is torn down on unmount.
 */
export function useNeonScroll(selector = "main section") {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const injected: HTMLElement[] = [];
    const rootStyle = document.documentElement.style;

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(selector).forEach((section) => {
        if (getComputedStyle(section).position === "static") {
          section.style.position = "relative";
        }

        // 1 — Electric Scroll: hue/brightness follow scroll progress.
        // Quantized: a filter change re-composites the whole section layer, and
        // at boundaries two sections update at once — only write on real steps.
        const setFilter = gsap.quickSetter(section, "filter") as (v: string) => void;
        let lastFilter = "";
        ScrollTrigger.create({
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            const hue = Math.round((self.progress - 0.5) * 30 * 2) / 2; // −15° → +15°, 0.5° steps
            const brightness = Math.round((1 + Math.sin(self.progress * Math.PI) * 0.12) * 200) / 200;
            const value = `hue-rotate(${hue}deg) brightness(${brightness})`;
            if (value !== lastFilter) {
              lastFilter = value;
              setFilter(value);
            }
          },
        });

        // 2 — Neon Streak: draw the left/right edges on first entry.
        const frame = document.createElement("div");
        frame.setAttribute("aria-hidden", "true");
        Object.assign(frame.style, {
          position: "absolute",
          inset: "0",
          pointerEvents: "none",
          zIndex: "5",
        });
        const strips = EDGES.map((edge) => {
          const strip = document.createElement("div");
          Object.assign(strip.style, {
            position: "absolute",
            background: "var(--neon-cyan)",
            boxShadow: "0 0 8px var(--neon-cyan)",
            display: "none",
            ...EDGE_STYLE[edge],
          });
          frame.appendChild(strip);
          return strip;
        });
        section.appendChild(frame);
        injected.push(frame);

        // Flash-and-fade: draw the edges, hold briefly, then fade fully out.
        const streak = gsap.timeline({
          paused: true,
          defaults: { duration: 0.3, ease: "none" },
          onComplete: () => {
            gsap.set(strips, { display: "none" });
          },
        });
        strips.forEach((strip) => streak.to(strip, { clipPath: "inset(0 0 0 0)" }));
        streak.to(strips, { opacity: 0.2, duration: 0.5, ease: "power2.out" });
        streak.to(strips, { opacity: 0, duration: 0.6, ease: "power1.in" }, "+=0.3");

        ScrollTrigger.create({
          trigger: section,
          start: "top 75%",
          once: true,
          onEnter: () => {
            gsap.set(strips, { display: "block" });
            streak.play();
          },
        });
      });
    });

    // 3 — Velocity-reactive glow: |scroll velocity| → box-shadow spread, smoothed.
    // Writing a root CSS var invalidates style for every var() consumer, so
    // quantize to 0.5px and skip the write when the value hasn't stepped.
    let spread = 20;
    let lastY = window.scrollY;
    let lastSpread = "";
    const onTick = () => {
      const lenis = getLenis();
      let velocity: number;
      if (lenis) {
        velocity = Math.abs(lenis.velocity);
      } else {
        velocity = Math.abs(window.scrollY - lastY);
        lastY = window.scrollY;
      }
      const target = gsap.utils.clamp(20, 60, 20 + velocity * 0.8);
      spread += (target - spread) * 0.1;
      const stepped = `${Math.round(spread * 2) / 2}px`;
      if (stepped !== lastSpread) {
        lastSpread = stepped;
        rootStyle.setProperty("--neon-spread", stepped);
      }
    };
    gsap.ticker.add(onTick);

    return () => {
      gsap.ticker.remove(onTick);
      ctx.revert(); // kills all ScrollTriggers + timelines created above
      injected.forEach((el) => el.remove());
      rootStyle.removeProperty("--neon-spread");
    };
  }, [selector]);
}
