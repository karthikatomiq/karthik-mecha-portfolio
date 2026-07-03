"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createTimeline, stagger } from "animejs";
import { markBooted } from "@/lib/boot";
import { useRevealTransition } from "@/hooks/useRevealTransition";

/**
 * Cyberpunk-style boot screen shown while the initial page load settles.
 * A percentage counter runs on a ~1.8s clock but parks at 92% until fonts
 * and the window load event actually arrive, so it tracks real readiness.
 * At 100% the useRevealTransition timeline takes over: flash, glitch-out,
 * blast doors parting into the hero. Skipped after the first load in a
 * tab session.
 */

const BOOT_LINES = [
  "INITIALIZING NEURAL LINK...",
  "MOUNTING WEAPON SYSTEMS...",
  "LOADING ASSET CACHE...",
  "SYNCING PILOT DATA...",
  "DECRYPTING LORE ARCHIVE...",
  "CALIBRATING HUD...",
  "ESTABLISHING SECTOR-IN UPLINK...",
];

const MIN_BOOT_MS = 1800;
const SKIP_KEY = "kos-boot-done";

/* Radar-clock dial: 60 minute marks on a 208px face. */
const TICK_COUNT = 60;
const TICK_RADIUS = 98;

type Phase = "loading" | "out" | "done";

/* useLayoutEffect warns during SSR; swap in useEffect on the server. */
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function LoadingScreen() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [pct, setPct] = useState(0);
  const [line, setLine] = useState(0);
  const clockRef = useRef<HTMLDivElement>(null);

  const scope = useRevealTransition(
    phase === "out",
    useCallback(() => setPhase("done"), []),
  );

  /* Repeat visits in the same tab session skip straight to the site,
     before first paint so the overlay never flashes. */
  useIsoLayoutEffect(() => {
    if (sessionStorage.getItem(SKIP_KEY)) {
      markBooted();
      setPhase("done");
    }
  }, []);

  /* Scroll stays locked through the reveal, released when it completes. */
  useEffect(() => {
    if (phase === "done") return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [phase]);

  /* Ambient radar-clock loop (Anime.js v4): tick marks ripple around the
     dial in a stagger wave while the sweep ring rotates a full turn.
     Purely decorative — the pct counter carries the real progress. */
  useEffect(() => {
    if (phase !== "loading") return;
    const clock = clockRef.current;
    if (!clock) return;
    const ticks = clock.querySelectorAll(".tick");
    const tl = createTimeline({ loop: true })
      .add(ticks, { y: "-=6", duration: 50 }, stagger(10))
      /* position 0, not "<": the ring sweeps the full loop from its start */
      .add(clock.querySelector(".ticker")!, { rotate: 360, duration: 1920, ease: "linear" }, 0)
      /* return leg so each loop starts from rest instead of snapping */
      .add(ticks, { y: "+=6", duration: 50 }, stagger(10, { start: 900 }));
    return () => {
      tl.pause();
      tl.revert();
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "loading") return;

    let ready = false;
    const loaded =
      document.readyState === "complete"
        ? Promise.resolve()
        : new Promise<void>((res) =>
            window.addEventListener("load", () => res(), { once: true }),
          );
    Promise.all([document.fonts.ready, loaded]).then(() => {
      ready = true;
    });

    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const linear = ((now - start) / MIN_BOOT_MS) * 100;
      const next = Math.min(Math.floor(linear), ready ? 100 : 92);
      setPct(next);
      if (next >= 100) {
        sessionStorage.setItem(SKIP_KEY, "1");
        setPhase("out");
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const lines = window.setInterval(
      () => setLine((l) => (l + 1) % BOOT_LINES.length),
      650,
    );
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(lines);
    };
  }, [phase]);

  if (phase === "done") return null;

  return (
    <div
      ref={scope}
      aria-hidden
      className={`ls-root fixed inset-0 z-[950] font-mono ${phase === "out" ? "pointer-events-none" : ""}`}
    >
      {/* blast doors — the opaque backdrop that parts to reveal the hero.
          51% each so they overlap 2% at center: borderless and identical
          bg-void, so no seam or sub-pixel gap can show mid-split. */}
      <div className="ls-door-l absolute inset-y-0 left-0 w-[51%] bg-void" />
      <div className="ls-door-r absolute inset-y-0 right-0 w-[51%] bg-void" />

      {/* boot UI layer — glitched out as one unit by the reveal timeline.
          Padded down so the persistent emblem above has clear space. */}
      <div className="ls-ui absolute inset-0 flex flex-col items-center justify-center pt-[12vh]">
        {/* drifting scanline field */}
        <div className="ls-scan absolute inset-x-0 -top-4 bottom-0" />

        {/* corner readouts */}
        <div className="absolute left-6 top-6 text-[10px] leading-relaxed tracking-[0.25em] text-white/40 md:left-10 md:top-10">
          <p>SYS.5.0 // BOOT_SEQ</p>
          <p className="text-accent/70">KARTHIK://OS 起動中</p>
        </div>
        <div className="absolute right-6 top-6 text-right text-[10px] leading-relaxed tracking-[0.25em] text-white/40 md:right-10 md:top-10">
          <p>UNIT: DEV-01</p>
          <p>PILOT: KARTHIK</p>
        </div>
        <div className="absolute bottom-6 left-6 text-[10px] leading-relaxed tracking-[0.25em] text-white/40 md:bottom-10 md:left-10">
          <p>MEM_CHK 0x7F3A00 — OK</p>
          <p>NEON_DRV 5.0 — ONLINE</p>
        </div>
        <div className="absolute bottom-6 right-6 text-right text-[10px] leading-relaxed tracking-[0.25em] text-white/40 md:bottom-10 md:right-10">
          <p>EARTH // SECTOR-IN</p>
          <p className="text-accent/70">LINK: {pct < 100 ? "SYNC" : "OPEN"}</p>
        </div>

        {/* radar-clock dial: sweep ring + 60 staggering tick marks,
            with the real percentage counter at its center */}
        <div ref={clockRef} className="relative mb-6 h-52 w-52">
          <div
            className="ticker absolute inset-4 rounded-full border border-accent/30"
            style={{
              boxShadow:
                "0 0 18px rgba(182, 255, 0, 0.12), inset 0 0 14px rgba(182, 255, 0, 0.08)",
            }}
          >
            {/* sweep-hand notch so the rotation reads */}
            <span
              className="absolute left-1/2 top-[-2px] h-3.5 w-px -translate-x-1/2 bg-accent"
              style={{ boxShadow: "0 0 8px rgba(182, 255, 0, 0.9)" }}
            />
          </div>
          {Array.from({ length: TICK_COUNT }, (_, i) => (
            <span
              key={i}
              className="absolute left-1/2 top-1/2"
              style={{ transform: `rotate(${(i * 360) / TICK_COUNT}deg)` }}
            >
              <span
                className={`tick block w-px ${i % 5 === 0 ? "h-2.5 bg-accent/70" : "h-2 bg-accent/30"}`}
                style={{ transform: `translateY(-${TICK_RADIUS}px)` }}
              />
            </span>
          ))}
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="ls-glitch text-4xl font-bold tabular-nums text-white">
              {String(pct).padStart(3, "0")}
              <span className="text-accent">%</span>
            </p>
          </div>
        </div>

        {/* cycling boot line; key remount replays the entry animation */}
        <p key={line} className="ls-line mt-4 text-[11px] tracking-[0.35em] text-accent/80">
          &gt; {BOOT_LINES[line]}
        </p>

        {/* segmented progress bar, sharp edges */}
        <div
          className="relative mt-10 h-2.5 w-[min(420px,70vw)] border border-accent/40"
          style={{ boxShadow: "0 0 14px rgba(182, 255, 0, 0.2)" }}
        >
          <div
            className="absolute inset-0 origin-left bg-accent"
            style={{ transform: `scaleX(${pct / 100})` }}
          />
          <div className="ls-segments absolute inset-0" />
        </div>
      </div>

      {/* persistent emblem: visible from mount through the whole boot,
          breathing idly; the reveal timeline swells + dissolves it as the
          doors part. Sibling after ls-ui so it stacks above the scanline
          field and survives the UI glitch-out. */}
      <div className="ls-symbol pointer-events-none absolute inset-x-0 top-[10vh] flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/symbol.png"
          alt=""
          draggable={false}
          className="ls-symbol-idle max-h-[26vh] w-auto select-none object-contain"
        />
      </div>

      {/* impact flash, driven by the reveal timeline */}
      <div
        className="ls-flash-el pointer-events-none absolute inset-0 opacity-0"
        style={{
          background:
            "radial-gradient(circle at center, rgba(255, 255, 255, 0.9) 0%, rgba(182, 255, 0, 0.5) 45%, transparent 75%)",
        }}
      />
    </div>
  );
}
