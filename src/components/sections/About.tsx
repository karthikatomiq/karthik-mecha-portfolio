"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import Corners from "@/components/Corners";
import OperatorCard from "@/components/OperatorCard";
import { siteConfig } from "@/data/config";

/**
 * THE LORE — GSAP-pinned horizontal scroll. Vertical scroll drives the
 * track sideways; the 領域展開 kanji drifts slower for parallax depth.
 */
export default function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const ctx = gsap.context(() => {
      const distance = () => track.scrollWidth - window.innerWidth;
      gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        force3D: true,
        roundProps: "x",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => "+=" + distance(),
          scrub: 1,
          pin: true,
          invalidateOnRefresh: true,
        },
      });
      // px-based with whole-pixel rounding: rounding xPercent steps a glyph
      // this wide by ~20px per tick, which reads as stutter while scrubbing.
      gsap.to(".about-kanji", {
        x: (_i, el) => -((el as HTMLElement).offsetWidth * 0.14),
        ease: "none",
        force3D: true,
        roundProps: "x",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => "+=" + distance(),
          scrub: 1.5,
          invalidateOnRefresh: true,
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    // No opaque background here — the global starfield must stay visible
    // through every section or it appears to vanish/restart at boundaries.
    <section ref={sectionRef} id="about" className="relative h-dvh overflow-hidden">
      {/* 領域展開 = Domain Expansion */}
      <div
        aria-hidden
        className="about-kanji pointer-events-none absolute top-1/2 left-[15vw] -translate-y-1/2 select-none whitespace-nowrap font-jp text-[55vh] font-black leading-none text-stroke"
      >
        領域展開
      </div>

      {/* domain instability flash */}
      <div aria-hidden className="animate-flicker pointer-events-none absolute inset-0 bg-white" />

      <div ref={trackRef} className="pin-track relative flex h-full w-max items-center gap-[12vw] px-[8vw]">
        {/* intro panel */}
        <div className="w-[86vw] shrink-0 md:w-[70vw]">
          <p className="mb-6 font-mono text-xs tracking-[0.4em] text-accent">
            02 // THE LORE — 物語
          </p>
          <h2 className="font-display text-[7vw] font-bold leading-[1.1] md:text-[5vw]">
            I ENGINEER
            <br />
            DIGITAL <span className="text-accent">DOMAINS</span>.
          </h2>
          <p className="mt-8 max-w-md font-mono text-sm leading-relaxed text-white/60">
            Full-stack by trade, DevOps by instinct. I expand a domain from a
            blank repo to a production fleet — and keep every layer honest.
          </p>
        </div>

        {/* operator profile cards */}
        {siteConfig.operators.map((op) => (
          <OperatorCard key={op.number} op={op} />
        ))}

        {/* obsession panels */}
        {siteConfig.lore.map((panel, i) => (
          <div key={i} className="relative w-[86vw] shrink-0 border border-white/10 bg-mecha-purple/20 p-8 md:w-[46vw] md:p-12">
            <Corners />
            <div className="flex items-start justify-between gap-6">
              <h3 className="whitespace-pre-line font-display text-[6vw] font-bold leading-[1.15] md:text-[2.6vw]">
                {panel.heading}
              </h3>
              <span aria-hidden className="font-jp text-5xl font-black text-cursed/60 md:text-6xl">
                {panel.kanji}
              </span>
            </div>
            <p className="mt-8 max-w-sm font-mono text-sm leading-relaxed text-white/60">
              {panel.body}
            </p>
            <span className="mt-10 block font-mono text-[10px] tracking-[0.3em] text-white/30">
              OBSESSION_{String(i + 1).padStart(2, "0")} / 03
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
